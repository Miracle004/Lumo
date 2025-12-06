import { Router } from "express";
import { createUser } from "../controllers/userController";
import passport from "passport";
import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
    }
  }
}

const routes = Router();

routes.post("/user/signup", createUser);

// routes.get('/user/login', login);
// routes.get(
//   "/user/login",
//   passport.authenticate("local", {
//     //Redirect to dashboard on success and back to login on failure(since this is just testing through endpoints, visualizing this is tricky);
//     successRedirect: "",
//     failureRedirect: "",
//   })
// );

routes.post("/user/login", (req, res, next) => {
  interface SafeUser {
    id: string;
    username: string;
    email: string;
  }

  interface AuthInfo {
    message?: string;
  }

  passport.authenticate(
    "local",
    (err: Error | null, user: Express.User | false, info: AuthInfo) => {
      if (err) return next(err);
      if (!user)
        return res
          .status(401)
          .json({
            success: false,
            message: info?.message ?? "Authentication failed",
          });
      req.logIn(user, (err: Error | null) => {
        if (err) return next(err);
        const safeUser: SafeUser = {
          id: user.id as string,
          username: user.username as string,
          email: user.email as string,
        };
        return res.json({ success: true, user: safeUser });
      });
    }
  )(req, res, next);
});

export default routes;
