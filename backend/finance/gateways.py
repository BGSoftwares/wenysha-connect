"""Server-side adapters for EcoCash Online Payments and ZimSwitch COPYandPAY."""

import base64
import json
import os
from decimal import Decimal, InvalidOperation
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class GatewayNotConfigured(Exception):
    pass


class GatewayError(Exception):
    pass


def _env(name, default=""):
    return os.environ.get(name, default).strip()


def _currency_list(name):
    values = [part.strip().upper() for part in _env(name, "USD").split(",") if part.strip()]
    return [value for value in values if value in {"USD", "ZWG"}] or ["USD"]


def online_payment_config():
    ecocash_required = (
        "ECOCASH_PAYMENT_URL", "ECOCASH_USERNAME", "ECOCASH_PASSWORD",
        "ECOCASH_MERCHANT_CODE", "ECOCASH_MERCHANT_PIN", "ECOCASH_MERCHANT_NUMBER",
        "ECOCASH_TERMINAL_ID", "ECOCASH_LOCATION", "ECOCASH_MERCHANT_NAME",
    )
    zimswitch_required = ("ZIMSWITCH_BASE_URL", "ZIMSWITCH_ENTITY_ID", "ZIMSWITCH_ACCESS_TOKEN")
    zimswitch_base = _env("ZIMSWITCH_BASE_URL").rstrip("/")
    return {
        "currencies": ["USD", "ZWG"],
        "providers": {
            "ecocash": {
                "enabled": all(_env(key) for key in ecocash_required),
                "currencies": _currency_list("ECOCASH_SUPPORTED_CURRENCIES"),
            },
            "zimswitch": {
                "enabled": all(_env(key) for key in zimswitch_required),
                "currencies": _currency_list("ZIMSWITCH_SUPPORTED_CURRENCIES"),
                "widget_url": f"{zimswitch_base}/v1/paymentWidgets.js" if zimswitch_base else "",
                "brands": _env("ZIMSWITCH_WIDGET_BRANDS", "VISA MASTER PRIVATE_LABEL"),
            },
        },
    }


def _request_json(url, method="GET", headers=None, data=None):
    body = None
    request_headers = {"Accept": "application/json", **(headers or {})}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        request_headers["Content-Type"] = "application/json"
    request = Request(url, data=body, headers=request_headers, method=method)
    try:
        with urlopen(request, timeout=25) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        try:
            details = json.loads(exc.read().decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            details = {}
        message = details.get("message") or details.get("detail") or "Payment provider rejected the request."
        raise GatewayError(str(message)[:200]) from exc
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise GatewayError("Could not reach the payment provider. Please retry or contact Accounts.") from exc
    if not isinstance(result, dict):
        raise GatewayError("The payment provider returned an invalid response.")
    return result


def _ecocash_headers():
    credentials = f"{_env('ECOCASH_USERNAME')}:{_env('ECOCASH_PASSWORD')}".encode("utf-8")
    token = base64.b64encode(credentials).decode("ascii")
    return {"Authorization": f"Basic {token}"}


def start_ecocash_payment(intent, phone_number):
    config = online_payment_config()["providers"]["ecocash"]
    if not config["enabled"]:
        raise GatewayNotConfigured("EcoCash Online Payments has not been configured for this school.")
    if intent.currency not in config["currencies"]:
        raise GatewayNotConfigured(f"EcoCash is not enabled for {intent.currency} invoices.")

    body = {
        "clientCorrelator": intent.client_reference,
        "referenceCode": intent.client_reference,
        "tranType": "MER",
        # EcoCash Online Payments expects the domestic MSISDN without 263.
        "endUserId": phone_number[-9:],
        "paymentAmount": {
            "charginginformation": {
                "amount": float(intent.amount),
                "currency": intent.currency,
                "description": f"School fees {intent.invoice.invoice_no}",
            },
            "chargeMetaData": {
                "channel": "WEB",
                "purchaseCategoryCode": "Online Payment",
                "onBeHalfOf": "ECOCASH",
            },
        },
        "merchantCode": _env("ECOCASH_MERCHANT_CODE"),
        "merchantPin": _env("ECOCASH_MERCHANT_PIN"),
        "merchantNumber": _env("ECOCASH_MERCHANT_NUMBER"),
        "countryCode": "ZW",
        "terminalID": _env("ECOCASH_TERMINAL_ID"),
        "location": _env("ECOCASH_LOCATION"),
        "superMerchantName": _env("ECOCASH_SUPER_MERCHANT_NAME", "ECOCASH"),
        "merchantName": _env("ECOCASH_MERCHANT_NAME"),
    }
    result = _request_json(_env("ECOCASH_PAYMENT_URL"), "POST", _ecocash_headers(), body)
    status = result.get("transactionOperationStatus")
    if result.get("clientCorrelator") == intent.client_reference and result.get("responseCode") == "00" and status == "Charged":
        return {"status": "paid", "provider_reference": result.get("ecocashReference", "")}
    if status and status.casefold() in {"failed", "rejected", "declined"}:
        return {"status": "failed", "error_code": str(result.get("responseCode", "DECLINED"))}
    if result.get("clientCorrelator") not in {None, intent.client_reference}:
        raise GatewayError("EcoCash returned a different transaction reference; the payment is not marked paid.")
    if result.get("responseCode") not in {None, "00"}:
        return {"status": "failed", "error_code": str(result.get("responseCode", "DECLINED"))}
    return {"status": "pending", "provider_reference": result.get("ecocashReference", "")}


def _ecocash_lookup_url(intent):
    charge_url = _env("ECOCASH_PAYMENT_URL").rstrip("/")
    marker = "/transactions/amount"
    if marker not in charge_url:
        raise GatewayNotConfigured("Set ECOCASH_PAYMENT_URL to the EcoCash charge endpoint.")
    root = charge_url.rsplit(marker, 1)[0]
    return f"{root}/{intent.payer_phone[-9:]}/transactions/amount/{intent.client_reference}"


def start_zimswitch_checkout(intent, shopper_result_url):
    config = online_payment_config()["providers"]["zimswitch"]
    if not config["enabled"]:
        raise GatewayNotConfigured("ZimSwitch Online has not been configured for this school.")
    if intent.currency not in config["currencies"]:
        raise GatewayNotConfigured(f"ZimSwitch is not enabled for {intent.currency} invoices.")

    body = urlencode({
        "entityId": _env("ZIMSWITCH_ENTITY_ID"),
        "amount": f"{intent.amount:.2f}",
        "currency": intent.currency,
        "paymentType": "DB",
        "merchantTransactionId": intent.client_reference,
    }).encode("utf-8")
    headers = {
        "Authorization": f"Bearer {_env('ZIMSWITCH_ACCESS_TOKEN')}",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
    }
    request = Request(f"{_env('ZIMSWITCH_BASE_URL').rstrip('/')}/v1/checkouts", data=body, headers=headers, method="POST")
    try:
        with urlopen(request, timeout=25) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise GatewayError("ZimSwitch could not prepare the checkout. Please retry or contact Accounts.") from exc
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise GatewayError("Could not reach ZimSwitch. Please retry or contact Accounts.") from exc

    if not isinstance(result, dict):
        raise GatewayError("ZimSwitch returned an invalid checkout response.")
    checkout_id = result.get("id")
    if not checkout_id:
        raise GatewayError("ZimSwitch did not return a checkout session.")
    return {
        "checkout_id": str(checkout_id),
        "widget_url": config["widget_url"],
        "brands": config["brands"],
        "shopper_result_url": shopper_result_url,
    }


def refresh_provider_status(intent):
    config = online_payment_config()["providers"].get(intent.provider, {})
    if not config.get("enabled"):
        raise GatewayNotConfigured(f"{intent.get_provider_display()} has not been configured for this school.")

    if intent.provider == "ecocash":
        result = _request_json(_ecocash_lookup_url(intent), headers=_ecocash_headers())
        provider_status = result.get("transactionOperationStatus")
        if result.get("clientCorrelator") == intent.client_reference and result.get("responseCode") == "00" and provider_status == "Charged":
            return {"status": "paid", "provider_reference": result.get("ecocashReference", "")}
        if provider_status and provider_status.casefold() in {"failed", "rejected", "declined"}:
            return {"status": "failed", "error_code": str(result.get("responseCode", "DECLINED"))}
        return {"status": "pending", "provider_reference": result.get("ecocashReference", "")}

    if not intent.checkout_id:
        raise GatewayError("ZimSwitch checkout reference is missing.")
    base_url = _env("ZIMSWITCH_BASE_URL").rstrip("/")
    url = f"{base_url}/v1/checkouts/{intent.checkout_id}/payment?{urlencode({'entityId': _env('ZIMSWITCH_ENTITY_ID')})}"
    result = _request_json(url, headers={"Authorization": f"Bearer {_env('ZIMSWITCH_ACCESS_TOKEN')}"})
    result_meta = result.get("result") or {}
    if not isinstance(result_meta, dict):
        result_meta = {}
    code = str(result_meta.get("code", ""))
    try:
        returned_amount = Decimal(str(result.get("amount", ""))).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        returned_amount = None
    amount_matches = returned_amount == intent.amount.quantize(Decimal("0.01"))
    currency_matches = str(result.get("currency", "")).upper() == intent.currency
    if code.startswith(("000.000.", "000.100.")) and amount_matches and currency_matches:
        return {"status": "paid", "provider_reference": str(result.get("id", ""))}
    if code.startswith("000.200.") or not code:
        return {"status": "pending", "provider_reference": str(result.get("id", ""))}
    return {"status": "failed", "error_code": code[:64] or "DECLINED"}
