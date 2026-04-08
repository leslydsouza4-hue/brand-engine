declare module "https://esm.run/@imgly/background-removal@1.5.6" {
  export function removeBackground(
    image: string | Blob | File | ArrayBuffer,
    config?: {
      publicPath?: string;
      progress?: (key: string, current: number, total: number) => void;
      model?: string;
      output?: { format?: string; quality?: number };
    }
  ): Promise<Blob>;
  export default removeBackground;
}
