declare global {
  type Message = { action: "updateData"; datasetId: string };

  interface UpdateDataResponse {
    success: boolean;
  }
}

export {};
