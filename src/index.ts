import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient, Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { JwtVariables, sign } from "hono/jwt";
import axios from "axios";
import { jwt } from "hono/jwt";
import bcrypt from "bcrypt";

type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();
const prisma = new PrismaClient();

app.use("/*", cors());

app.use("/protected/*", jwt({ secret: "mySecretKey" }));

//register
app.post("/register", async (c) => {
  try {
    const { email, password } = await c.req.json();

    //hashed password
    const bcryptHash = await bcrypt.hash(password, 10);

    //new user creation
    const user = await prisma.user.create({
      data: { email, hashedPassword: bcryptHash },
    });

    return c.json({ message: `${user.email} created successfully` });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return c.json({ message: "Email already exists" }, 400);
    }
    console.error("Registration error:", e);
    throw new HTTPException(500, { message: "Internal Server Error" });
  }
});

//login
app.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    //fetch with email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, hashedPassword: true },
    });

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    //password verify
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return c.json({ message: "Invalid credentials" }, 401);
    }

    //jwt token
    const payload = { sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }; // 60 minutes expiry
    const token = await sign(payload, "mySecretKey");

    return c.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    throw new HTTPException(500, { message: "Internal Server Error" });
  }
});

//fetch pokeapi
app.get("/pokemon/:name", async (c) => {
  const { name } = c.req.param();

  try {
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${name}`
    );
    return c.json({ data: response.data });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return c.json({ message: "Your Pokémon was not found!" }, 404);
      }
      return c.json({ message: "Error fetching Pokémon data" }, 500);
    }
    return c.json({ message: "An unexpected error occurred" }, 500);
  }
});

//catch and store pokemon
app.post("/protected/catch", async (c) => {
  const payload = c.get("jwtPayload");

  if (!payload) {
    throw new HTTPException(401, { message: "YOU ARE UNAUTHORIZED" });
  }

  try {
    const { name: pokemonName } = await c.req.json();

    if (!pokemonName) {
      return c.json({ message: "Pokemon name is required" }, 400);
    }

    let pokemon = await prisma.pokemon.findUnique({
      where: { name: pokemonName },
    });

    //create new pokemon if not found
    if (!pokemon) {
      pokemon = await prisma.pokemon.create({ data: { name: pokemonName } });
    }

    //store caught pokemon
    const caughtPokemon = await prisma.caughtPokemon.create({
      data: {
        userId: payload.sub,
        pokemonId: pokemon.id,
      },
    });

    return c.json({ message: "Pokemon caught", data: caughtPokemon });
  } catch (error) {
    console.error("Catch Pokémon error:", error);
    throw new HTTPException(500, { message: "Internal Server Error" });
  }
});

//remove pokemon from caught list/database
app.delete("/protected/release/:id", async (c) => {
  const payload = c.get("jwtPayload");

  if (!payload) {
    throw new HTTPException(401, { message: "YOU ARE UNAUTHORIZED" });
  }

  const { id } = c.req.param();

  try {
    const deleteResult = await prisma.caughtPokemon.deleteMany({
      where: { id: parseInt(id), userId: payload.sub },
    });

    if (deleteResult.count === 0) {
      return c.json({ message: "Pokemon not found or not owned by user" }, 404);
    }

    return c.json({ message: "Pokemon is released" });
  } catch (error) {
    console.error("Release Pokémon error:", error);
    throw new HTTPException(500, { message: "Internal Server Error" });
  }
});

//caught pokemon list
app.get("/protected/caught", async (c) => {
  const payload = c.get("jwtPayload");

  if (!payload) {
    throw new HTTPException(401, { message: "YOU ARE UNAUTHORIZED" });
  }

  try {
    const caughtPokemon = await prisma.caughtPokemon.findMany({
      where: { userId: payload.sub },
      include: { pokemon: true },
    });

    if (!caughtPokemon.length) {
      return c.json({ message: "No Pokémon found." });
    }

    return c.json({ data: caughtPokemon });
  } catch (error) {
    console.error("Fetch caught Pokémon error:", error);
    throw new HTTPException(500, { message: "Internal Server Error" });
  }
});

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
