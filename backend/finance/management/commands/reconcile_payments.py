import time

from django.core.management.base import BaseCommand

from finance.services import reconcile_pending_payments


class Command(BaseCommand):
    help = (
        'Confirm pending EcoCash/ZimSwitch payments with the provider so fees are credited even when '
        'the parent has closed the browser. Use --loop to keep running as a worker.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--loop', action='store_true', help='Keep running instead of checking once.')
        parser.add_argument('--interval', type=int, default=60, help='Seconds between checks with --loop (default 60).')

    def handle(self, *args, **options):
        interval = max(15, options['interval'])
        while True:
            try:
                result = reconcile_pending_payments()
                if result['checked'] or result['expired']:
                    self.stdout.write(f"checked={result['checked']} paid={result['paid']} failed={result['failed']} expired={result['expired']}")
            except Exception as exc:  # keep the worker alive through database or network blips
                self.stderr.write(f'Reconcile run failed: {exc}')
                if not options['loop']:
                    raise
            if not options['loop']:
                return
            time.sleep(interval)
