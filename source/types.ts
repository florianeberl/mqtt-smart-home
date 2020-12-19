export enum MqttTopics {
    LIGHT_INTENSITY = "light/intensity",
    LIGHT_INTENSITY_UPDATE_REQUEST = "light/intensity/update",
    LIGHT_SENSOR_STATUS = "light/sensor/status",
    LIGHT_SENSOR_STATUS_UPDATE_REQUEST = "light/sensor/status/update",
}

export enum LightIntensity {
    UNKNOWN = "UNKNOWN",
    DARK = "DARK",
    BRIGHT = "BRIGHT",
}

export enum LightSensorStatus {
    AVAILABLE = "AVAILABLE",
    NOT_AVAILABLE = "NOT_AVAILABLE",
    UNKNOWN = "UNKNOWN",
}