import { getCompanionMovementSpeed } from "../domain/catFsm";
import type { CatTemperament } from "../types";

export type CompanionRouteName = "floor-to-food-bowl";

export interface CompanionRoutePose {
  x: number;
  y: number;
  facingLeft: boolean;
}

export interface CompanionRouteFrame {
  phase: "cruise" | "arrival" | "contact" | "arrived" | "cancelling" | "cancelled";
  pose: CompanionRoutePose;
}

interface CompanionRouteStart {
  pose: CompanionRoutePose;
  startedAt: number;
}

interface ActiveRoute {
  from: CompanionRoutePose;
  waypoint: CompanionRoutePose;
  destination: CompanionRoutePose;
  startedAt: number;
  cruiseDuration: number;
}

interface ActiveCancellation {
  from: CompanionRoutePose;
  floorY: number;
  startedAt: number;
}

export interface CompanionRouteExecutor {
  start(name: CompanionRouteName, input: CompanionRouteStart): "started" | "rejected-active";
  advance(time: number): CompanionRouteFrame | null;
  cancel(time: number, renderedPose: CompanionRoutePose): CompanionRouteFrame | null;
}

const ROUTE_DESTINATIONS: Record<CompanionRouteName, CompanionRoutePose> = {
  "floor-to-food-bowl": { x: 471, y: 259, facingLeft: false },
};
const FOOD_BOWL_WAYPOINT_OFFSET_X = 36;
const MIN_CRUISE_MS = 900;
const CRUISE_FACTOR = 1.1;
const ARRIVAL_MS = 200;
const CONTACT_MS = 150;
const CANCELLATION_MS = 200;

const linear = (from: number, to: number, progress: number) => from + (to - from) * progress;
const sineInOut = (progress: number) => -(Math.cos(Math.PI * progress) - 1) / 2;
const sineOut = (progress: number) => Math.sin((Math.PI * progress) / 2);

export function getCompanionRouteDestination(
  name: CompanionRouteName,
): CompanionRoutePose {
  return { ...ROUTE_DESTINATIONS[name] };
}

export function createCompanionRouteExecutor(temperament: CatTemperament): CompanionRouteExecutor {
  let active: ActiveRoute | null = null;
  let cancellation: ActiveCancellation | null = null;

  const frameForRoute = (route: ActiveRoute, time: number): CompanionRouteFrame => {
    const elapsed = Math.max(time - route.startedAt, 0);
    const cruiseEnd = route.cruiseDuration;
    const arrivalEnd = cruiseEnd + ARRIVAL_MS;
    const contactEnd = arrivalEnd + CONTACT_MS;

    if (route.cruiseDuration > 0 && elapsed <= cruiseEnd) {
      const progress = sineInOut(elapsed / route.cruiseDuration);
      return {
        phase: "cruise",
        pose: {
          x: linear(route.from.x, route.waypoint.x, progress),
          y: linear(route.from.y, route.waypoint.y, progress),
          facingLeft: route.waypoint.facingLeft,
        },
      };
    }

    if (elapsed <= arrivalEnd) {
      const progress = sineOut((elapsed - cruiseEnd) / ARRIVAL_MS);
      return {
        phase: "arrival",
        pose: {
          x: linear(route.waypoint.x, route.destination.x, progress),
          y: linear(route.waypoint.y, route.destination.y, progress),
          facingLeft: route.destination.facingLeft,
        },
      };
    }

    if (elapsed <= contactEnd) {
      return { phase: "contact", pose: route.destination };
    }

    return { phase: "arrived", pose: route.destination };
  };

  return {
    start(name, input) {
      if (active || cancellation) {
        return "rejected-active";
      }

      const destination = getCompanionRouteDestination(name);
      const direction = destination.x >= input.pose.x ? 1 : -1;
      const authoredWaypointX =
        destination.x + (direction > 0 ? -1 : 1) * FOOD_BOWL_WAYPOINT_OFFSET_X;
      const waypointX =
        direction > 0
          ? Math.max(input.pose.x, authoredWaypointX)
          : Math.min(input.pose.x, authoredWaypointX);
      const cruiseDistance = Math.abs(waypointX - input.pose.x);
      const movementSpeed = getCompanionMovementSpeed(temperament);
      const cruiseDuration = Math.max(
        cruiseDistance > 0
          ? Math.round((cruiseDistance / movementSpeed) * 1_000 * CRUISE_FACTOR)
          : 0,
        cruiseDistance > 0 ? MIN_CRUISE_MS : 0,
      );

      active = {
        from: input.pose,
        waypoint: { x: waypointX, y: input.pose.y, facingLeft: direction < 0 },
        destination: { ...destination, facingLeft: direction < 0 },
        startedAt: input.startedAt,
        cruiseDuration,
      };
      return "started";
    },

    advance(time) {
      if (cancellation) {
        const progress = Math.min(Math.max((time - cancellation.startedAt) / CANCELLATION_MS, 0), 1);
        const pose = {
          ...cancellation.from,
          y: linear(cancellation.from.y, cancellation.floorY, sineOut(progress)),
        };
        if (progress >= 1) {
          cancellation = null;
          return { phase: "cancelled", pose };
        }
        return { phase: "cancelling", pose };
      }

      if (!active) {
        return null;
      }

      const frame = frameForRoute(active, time);
      if (frame.phase === "arrived") {
        active = null;
      }
      return frame;
    },

    cancel(time, renderedPose) {
      if (!active) {
        return null;
      }

      const floorY = active.from.y;
      active = null;
      cancellation = { from: renderedPose, floorY, startedAt: time };
      return { phase: "cancelling", pose: renderedPose };
    },
  };
}
