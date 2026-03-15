import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AP Election Map API",
      version: "1.0.0",
      description:
        "REST API for the Andhra Pradesh Interactive Political Map — " +
        "exposes geo boundaries, election results, and booth-level data.",
      contact: { name: "AP Map Team" },
    },
    servers: [
      { url: "http://localhost:4000/api/v1", description: "Development" },
      { url: "https://api.apelectionmap.in/v1", description: "Production" },
    ],
    tags: [
      { name: "Geo",     description: "GeoJSON boundary data" },
      { name: "Results", description: "Election results and statistics" },
      { name: "Lookup",  description: "Filter dropdown values and search" },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
