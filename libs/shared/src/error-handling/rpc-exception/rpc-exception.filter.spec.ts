import { GlobalRpcExceptionFilter } from './rpc-exception.filter';

describe('GlobalRpcExceptionFilter', () => {
  it('should be defined', () => {
    expect(new GlobalRpcExceptionFilter()).toBeDefined();
  });
});
