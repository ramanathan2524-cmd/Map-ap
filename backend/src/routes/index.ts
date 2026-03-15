import { Router } from "express";
import geoRouter from "./geo";
import resultsRouter from "./results";
import lookupRouter from "./lookup";

export const apiRouter = Router();

apiRouter.use("/geo",     geoRouter);
apiRouter.use("/results", resultsRouter);
apiRouter.use("/lookup",  lookupRouter);
