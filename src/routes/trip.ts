import express from "express";
import { Trip } from "../controllers/trip";
import { authenticateJWT } from "../middlewares/auth";

export const trip = (db: any) => {
  const router = express.Router();
  const tripController = new Trip(db);

  router.post(
    "/generate",
    authenticateJWT,
    tripController.generateItineraryHandler
  );

  router.post(
    "/suggested-places",
    authenticateJWT,
    tripController.generateSuggestedPlacesHandler
  );

  router.get(
    "/created",
    authenticateJWT,
    tripController.myCreatedTripsHandler
  );

  router.get(
    "/wishlist",
    authenticateJWT,
    tripController.getWishlistedTripsHandler
  );

  router.get(
    "/",
    authenticateJWT,
    tripController.getTripsHandler
  );

  router.get(
    "/:id",
    authenticateJWT,
    tripController.getTripByIdHandler
  );

  router.post(
    "/:id/wishlist",
    authenticateJWT,
    tripController.addToWishlistHandler
  );

  router.get(
    "/itinerary/:id",
    authenticateJWT,
    tripController.getItineraryByIdHandler
  );

  return router;
};
