export const mockRepository = {
  save: jest.fn().mockResolvedValue(null),
  createQueryBuilder: jest.fn().mockReturnValue({
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    execute: jest.fn(),
  }),
};
