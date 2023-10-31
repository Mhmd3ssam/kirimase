import { existsSync, readFileSync } from "fs";
import { AvailablePackage, Config, DBProviderOptions } from "../../types.js";
import { updateConfigFile, wrapInParenthesis } from "../../utils.js";
import { consola } from "consola";

export const DBProviders: DBProviderOptions = {
  pg: [
    { name: "Postgres.JS", value: "postgresjs" },
    { name: "node-postgres", value: "node-postgres" },
    { name: "Neon", value: "neon" },
    { name: "Vercel Postgres", value: "vercel-pg" },
    { name: "Supabase", value: "supabase" },
    {
      name: "AWS Data API",
      value: "aws",
      disabled: wrapInParenthesis("Not supported"),
    },
  ],
  mysql: [
    { name: "PlanetScale", value: "planetscale" },
    { name: "MySQL 2", value: "mysql-2" },
  ],
  sqlite: [
    { name: "better-sqlite3", value: "better-sqlite3" },
    // { name: "Bun SQLite", value: "bun-sqlite" },
  ],
};

export const checkForExistingPackages = () => {
  consola.start("Checking project for existing packages...");
  // get package json
  const packageJsonInitText = readFileSync("package.json", "utf-8");

  let configObj: Partial<Config> = {
    packages: [],
  };
  const packages: Partial<Record<AvailablePackage, string[]>> = {
    drizzle: ["drizzle-orm", "drizzle-kit"],
    trpc: ["@trpc/client", "@trpc/react-query", "@trpc/server", "@trpc/next"],
    clerk: ["@clerk/nextjs"],
    lucia: ["lucia"],
    prisma: ["prisma"],
    resend: ["resend"],
    stripe: ["stripe", "@stripe/stripe-js"],
    "next-auth": ["next-auth", "@auth/core"],
  };

  const packageTypeMappings: Partial<
    Record<AvailablePackage, "orm" | "auth" | null>
  > = {
    stripe: null,
    resend: null,
    prisma: "orm",
    trpc: null,
    clerk: "auth",
    "next-auth": "auth",
    lucia: "auth",
    drizzle: "orm",
  };

  for (const [key, terms] of Object.entries(packages)) {
    // console.log(key, terms);
    if (!terms) continue;

    // Loop over each term in the array
    let existsInProject = false;
    for (const term of terms) {
      // Check if the term is present in the text file content
      if (packageJsonInitText.includes(term)) {
        // set object
        existsInProject = true;
        // if (packageTypeMappings[key] !== null) {
        //   configObj[packageTypeMappings[key]] = key;
        //   configObj.packages.push(key as AvailablePackage);
        // }
      }
    }
    if (existsInProject && packageTypeMappings[key] !== null)
      configObj[packageTypeMappings[key]] = key;
    if (existsInProject) configObj.packages.push(key as AvailablePackage);
  }

  const hasComponentsJson = existsSync("components.json");
  if (hasComponentsJson) configObj.componentLib = "shadcn-ui";

  consola.success(
    "Successfully searched project and found the following packages already installed:"
  );
  consola.box(configObj);
  updateConfigFile(configObj);

  // for each item, confirm with user that it is actually installed
  // for shadcn, check if components.json exists
  // if (drizzle), check if using one schema file or schema directory - perhaps just force users?
};
