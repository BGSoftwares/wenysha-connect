/** jsPDF is large, so it is fetched only when someone actually exports a PDF. */
export const loadJsPdf = async () => (await import("jspdf")).default;
