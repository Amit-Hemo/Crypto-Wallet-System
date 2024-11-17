export class SuccessResponse<T> {
  private readonly status = 'success';
  constructor(
    private readonly message: string,
    public readonly data: T | null = null,
  ) {}
}

export class ErrorResponse {
  private readonly status: string = 'error';
  private readonly timestamp: string;
  constructor(
    private readonly statusCode: number,
    private readonly message: string = 'Internal server error',
    private readonly path: string = '',
  ) {
    this.timestamp = new Date().toISOString();
  }
}
