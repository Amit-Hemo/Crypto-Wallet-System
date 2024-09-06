export class SuccessResponse<T> {
  private readonly status = 'success';
  constructor(
    private readonly message: string,
    private readonly data: T | null = null,
    private readonly isCached: boolean = false,
  ) {}
}
