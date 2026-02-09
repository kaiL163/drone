import robomaster
from robomaster import robot


if __name__ == "__main__":

    tl_drone = robot.Drone()
    tl_drone.initialize()

    tl_flight = tl_drone.flight

    tl_flight.takeoff().wait_for_completed()

    tl_flight.forward(distance=100).wait_for_completed()
    tl_flight.right(distance=100).wait_for_completed()
    tl_flight.back(distance=100).wait_for_completed()
    tl_flight.left(distance=100).wait_for_completed()

    tl_flight.land().wait_for_completed()

    tl_drone.close()