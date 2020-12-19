import * as Dotenv from "dotenv";

Dotenv.config();

export function getMqttUrl(): string {
    return `${process.env.PROTOCOL}://${process.env.HOST}:${process.env.PORT}`;
}