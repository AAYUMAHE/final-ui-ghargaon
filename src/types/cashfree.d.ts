declare module "@cashfreepayments/cashfree-js" {
  export function load(options: {
    mode: "sandbox" | "production";
  }): Promise<{
    checkout: (options: {
      paymentSessionId: string;
      redirectTarget?: "_self" | "_blank";
    }) => Promise<void>;
  }>;
}