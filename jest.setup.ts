/// <reference types="jest" />
import dotenv from "dotenv";

dotenv.config({ quiet: true });

afterEach(() => new Promise((resolve) => setTimeout(resolve, 100)));
