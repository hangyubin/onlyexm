interface JwtPayload {
  userId: number;
  role: string;
  department: string;
}

declare namespace Express {
  interface Request {
    user?: JwtPayload;
  }
}