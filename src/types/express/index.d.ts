import { IUser } from "../../models/userModel";

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // make sure IUser is exported from your userModel
    }
  }
}
