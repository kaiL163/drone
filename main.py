import robomaster
import cv2
from robomaster import robot


if __name__ == "__main__":

    tl_drone = robot.Drone()
    tl_drone.initialize()

    version = tl_drone.get_sdk_version()
    print("Версия дрончика: {0}".format(version))

    tl_battery = tl_drone.battery
    battery_info = tl_battery.get_battery()
    print("Заряд батарейки: {0}".format(battery_info))

    tl_flight = tl_drone.flight
    tl_flight.takeoff().wait_for_completed()
    tl_flight.land().wait_for_completed()

    tl_camera = tl_drone.camera
    tl_camera.start_video_stream(display=False)
    tl_camera.set_fps("high")
    tl_camera.set_resolution("high")
    tl_camera.set_bitrate(6)
    
    for i in range(0, 302):
        img = tl_camera.read_cv2_image()
        if img is not None:
            cv2.imshow("Дрон", img)
            cv2.waitKey(1)
        else:
            print(f"Предупреждение: Не удалось прочитать кадр на итерации {i}")
    
    cv2.destroyAllWindows()
    tl_camera.stop_video_stream()


    tl_drone.close()