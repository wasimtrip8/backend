import express from "express";
import { Itinerary } from "../controllers/itinerary";
import { authenticateJWT } from "../middlewares/auth"; 

export const itinerary = (db: any) => {
  const router = express.Router();
  const itineraryController = new Itinerary(db);

  router.post(
    "/generate",
    authenticateJWT,                 
    itineraryController.generateItineraryHandler
  );

   router.post(
    "/suggested-places",
    authenticateJWT,                 
    itineraryController.generateSuggestedPlacesHandler
  );

   router.get(
    "/",
    authenticateJWT,                 
    itineraryController.getTripsHandler
  );

     router.get(
    "/:id",
    authenticateJWT,                 
    itineraryController.getTripByIdHandler
  );

  return router;
};
