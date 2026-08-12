import { getCompanionMovementSpeed } from "../domain/catFsm";
import type { CatTemperament } from "../types";

export type CompanionRouteName = "floor-to-food-bowl" | "food-bowl-to-floor";

export interface CompanionRoutePose {
  x: number;
  y: number;
  facingLeft: boolean;
  velocityX: number;
  velocityY: number;
}

export interface CompanionRouteFrame {
  route: CompanionRouteName;
  phase: "cruise" | "arrival" | "contact" | "arrived" | "cancelling" | "cancelled";
  velocityX: number;
  velocityY: number;
  facingLeft: boolean;
  y?: number;
}

interface RoutePoint { x: number; y: number }
interface ActiveRoute {
  name: CompanionRouteName;
  waypoints: RoutePoint[];
  waypointIndex: number;
  destination: RoutePoint;
  facingLeft: boolean;
  arrivalStartedAt?: number;
  arrivalVelocityX?: number;
  arrivalVelocityY?: number;
  contactStartedAt?: number;
}
interface Cancellation { route: CompanionRouteName; fromY: number; startedAt: number }

export interface CompanionRouteExecutor {
  start(name: CompanionRouteName, input: { pose: CompanionRoutePose }): "started" | "rejected-active";
  advance(time: number, pose: CompanionRoutePose): CompanionRouteFrame | null;
  cancel(time: number, pose: CompanionRoutePose): CompanionRouteFrame | null;
}

const FLOOR_Y = 225;
const BOWL_X = 471;
const BOWL_Y = 259;
const OUTER_OFFSET_X = 72;
const INNER_OFFSET_X = 24;
const OUTER_Y = FLOOR_Y + 5;
const INNER_Y = BOWL_Y - 12;
const RETURN_OFFSET_X = 80;
const TOLERANCE = 4;
const DECELERATION_MS = 200;
const CONTACT_MS = 150;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const linear = (from: number, to: number, progress: number) => from + (to - from) * progress;
const sineOut = (progress: number) => Math.sin((Math.PI * progress) / 2);

export function getCompanionRouteDestination(name: CompanionRouteName): { x: number; y: number } {
  if (name === "floor-to-food-bowl") return { x: BOWL_X, y: BOWL_Y };
  return { x: BOWL_X - RETURN_OFFSET_X, y: FLOOR_Y };
}

export function createCompanionRouteExecutor(
  temperament: CatTemperament,
  walkPaceSeed = 0,
): CompanionRouteExecutor {
  let active: ActiveRoute | null = null;
  let cancellation: Cancellation | null = null;

  const remainingDistance = (route: ActiveRoute, pose: CompanionRoutePose) => {
    const points = [...route.waypoints.slice(route.waypointIndex), route.destination];
    let previous = pose;
    return points.reduce((total, point) => {
      const segment = Math.hypot(point.x - previous.x, point.y - previous.y);
      previous = { ...previous, ...point };
      return total + segment;
    }, 0);
  };

  const targetSpeed = (distance: number, time: number) => {
    const distanceEase = clamp(distance / 92, 0.22, 0.94);
    const curiousSlowdown = 0.82 + Math.sin(time * 0.0024 + walkPaceSeed) * 0.1;
    const tinyHesitation = Math.sin(time * 0.0015 + walkPaceSeed * 0.7) > 0.96 ? 0.7 : 1;
    return getCompanionMovementSpeed(temperament) * distanceEase * curiousSlowdown * tinyHesitation;
  };

  return {
    start(name, { pose }) {
      if (active || cancellation) return "rejected-active";

      const approaching = name === "floor-to-food-bowl";
      const direction = approaching ? (BOWL_X >= pose.x ? 1 : -1) : pose.facingLeft ? 1 : -1;
      const facingLeft = approaching ? direction < 0 : !pose.facingLeft;
      const authored = approaching
        ? [
            { x: BOWL_X - direction * OUTER_OFFSET_X, y: OUTER_Y },
            { x: BOWL_X - direction * INNER_OFFSET_X, y: INNER_Y },
          ]
        : [
            { x: BOWL_X + direction * INNER_OFFSET_X, y: INNER_Y },
            { x: BOWL_X + direction * OUTER_OFFSET_X, y: OUTER_Y },
          ];
      const waypoints = approaching
        ? authored.filter((point) => direction > 0 ? point.x > pose.x + TOLERANCE : point.x < pose.x - TOLERANCE)
        : authored;
      active = {
        name,
        waypoints,
        waypointIndex: 0,
        destination: approaching ? { x: BOWL_X, y: BOWL_Y } : { x: BOWL_X + direction * RETURN_OFFSET_X, y: FLOOR_Y },
        facingLeft,
      };
      return "started";
    },

    advance(time, pose) {
      if (cancellation) {
        const progress = clamp((time - cancellation.startedAt) / DECELERATION_MS, 0, 1);
        const frame: CompanionRouteFrame = {
          route: cancellation.route,
          phase: progress >= 1 ? "cancelled" : "cancelling",
          velocityX: 0,
          velocityY: 0,
          facingLeft: pose.facingLeft,
          y: linear(cancellation.fromY, FLOOR_Y, sineOut(progress)),
        };
        if (progress >= 1) cancellation = null;
        return frame;
      }
      if (!active) return null;

      if (active.arrivalStartedAt === undefined) {
        const waypoint = active.waypoints[active.waypointIndex];
        const target = waypoint ?? active.destination;
        const distanceX = target.x - pose.x;
        const distanceY = target.y - pose.y;
        const distance = Math.hypot(distanceX, distanceY);
        if (distance > TOLERANCE) {
          const currentSpeed = Math.hypot(pose.velocityX, pose.velocityY);
          const speed = linear(currentSpeed, targetSpeed(remainingDistance(active, pose), time), 0.08);
          return { route: active.name, phase: "cruise", velocityX: (distanceX / distance) * speed, velocityY: (distanceY / distance) * speed, facingLeft: distanceX < 0 };
        }
        if (waypoint) {
          active.waypointIndex += 1;
          return this.advance(time, pose);
        }
        active.arrivalStartedAt = time;
        active.arrivalVelocityX = pose.velocityX;
        active.arrivalVelocityY = pose.velocityY;
      }

      const arrivalElapsed = Math.max(time - active.arrivalStartedAt, 0);
      if (arrivalElapsed < DECELERATION_MS) {
        const deceleration = 1 - sineOut(arrivalElapsed / DECELERATION_MS);
        return { route: active.name, phase: "arrival", velocityX: (active.arrivalVelocityX ?? 0) * deceleration, velocityY: (active.arrivalVelocityY ?? 0) * deceleration, facingLeft: active.facingLeft };
      }
      const destinationDistance = Math.hypot(active.destination.x - pose.x, active.destination.y - pose.y);
      if (destinationDistance > TOLERANCE) {
        active.arrivalStartedAt = undefined;
        active.arrivalVelocityX = undefined;
        active.arrivalVelocityY = undefined;
        return this.advance(time, pose);
      }
      active.contactStartedAt ??= time;
      if (time - active.contactStartedAt < CONTACT_MS) {
        return { route: active.name, phase: "contact", velocityX: 0, velocityY: 0, facingLeft: active.facingLeft };
      }
      const route = active.name;
      const facingLeft = active.facingLeft;
      active = null;
      return { route, phase: "arrived", velocityX: 0, velocityY: 0, facingLeft };
    },

    cancel(time, pose) {
      if (!active) return null;
      const route = active.name;
      active = null;
      cancellation = { route, fromY: pose.y, startedAt: time };
      return { route, phase: "cancelling", velocityX: 0, velocityY: 0, facingLeft: pose.facingLeft, y: pose.y };
    },
  };
}
