import {
	createRootRoute,
	createRoute,
	createRouter,
	Link,
	Outlet,
	RouterProvider,
	useRouterState,
} from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const Url = () => {
	const href = useRouterState({ select: (s) => s.location.href });
	return (
		<pre
			style={{
				background: "#f4f4f5",
				padding: 12,
				overflowX: "auto",
				fontSize: 13,
			}}
		>
			{href}
		</pre>
	);
};

// The control that breaks: one key, one write, nothing else.
const ViewToggle = () => {
	const [view, setView] = useQueryState(
		"view",
		parseAsStringLiteral(["data", "structure"]).withDefault("data"),
	);
	return (
		<p>
			<button type="button" onClick={() => setView("structure")}>
				set view=structure
			</button>{" "}
			<button type="button" onClick={() => setView("data")}>
				set view=data
			</button>{" "}
			<code>view = {view}</code>
		</p>
	);
};

const rootRoute = createRootRoute({
	component: () => (
		<NuqsAdapter>
			<main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 900 }}>
				<h1>nuqs + TanStack Router: a write adds a second query string</h1>
				<p>
					<Link
						to="/database/$table"
						params={{ table: "customers" }}
						search={{ schema: "public", limit: 25, view: "data" }}
					>
						broken: route with a dynamic segment
					</Link>{" "}
					|{" "}
					<Link to="/customers" search={{ limit: 25 }}>
						fine: route without one
					</Link>
				</p>
				<Url />
				<Outlet />
			</main>
		</NuqsAdapter>
	),
});

// Has a dynamic segment. The glued-together path still matches this route,
// with the query string swallowed as the `table` param, so the route resolves
// and its defaults are appended as a second query string.
const tableRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/database/$table",
	validateSearch: (raw) => ({
		schema: typeof raw.schema === "string" ? raw.schema : "public",
		limit: raw.limit === undefined ? 50 : Number(raw.limit),
		view: raw.view === "structure" ? "structure" : "data",
	}),
	component: () => (
		<section>
			<h2>/database/$table</h2>
			<p>
				Click a button. The URL above gets a second <code>?</code>, and the
				value you set is read back from the tail, so the toggle does not stick.
			</p>
			<ViewToggle />
		</section>
	),
});

// No dynamic segment. The glued-together path matches nothing, the appended
// search is empty, and the browser splits the pathname back correctly.
const flatRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/customers",
	validateSearch: (raw) => ({
		limit: raw.limit === undefined ? 25 : Number(raw.limit),
		view: raw.view === "structure" ? "structure" : "data",
	}),
	component: () => (
		<section>
			<h2>/customers</h2>
			<p>Same control, same adapter. This one works.</p>
			<ViewToggle />
		</section>
	),
});

const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: () => <p>Pick a route above.</p>,
});

const router = createRouter({
	routeTree: rootRoute.addChildren([indexRoute, tableRoute, flatRoute]),
	// No custom parseSearch / stringifySearch. Library defaults only.
});

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
);
