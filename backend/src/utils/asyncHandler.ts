import { NextFunction, Request, Response } from "express";

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Express 4 не подхватывает отклонённые промисы автоматически — оборачиваем
// контроллеры, чтобы ошибки уходили в errorHandler middleware.
export function asyncHandler(fn: Handler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
