export class HeaderStrategy {
  async validateRequest(req: any): Promise<any> {
    const userHeader = req.headers["x-user"];
    if (!userHeader) return null;

    try {
      return typeof userHeader === "string"
        ? JSON.parse(userHeader)
        : userHeader;
    } catch {
      return null;
    }
  }
}
