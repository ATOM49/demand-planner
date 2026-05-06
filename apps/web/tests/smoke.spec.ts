import { expect, test } from "@playwright/test";

test("dashboard loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Demand Planner Dashboard/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Aggregate demand outlook/i })).toBeVisible();
  await expect(page.getByText(/Latest inference date:/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /All SKU summaries/i })).toBeVisible();
  await expect(page.getByLabel(/Open SKU workbench/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Show only SKUs with alerts/i })).toBeVisible();
});

test("dashboard search opens a sku workbench", async ({ page }) => {
  await page.goto("/");

  const firstSkuLink = page.locator("tbody tr").first().locator("a").first();
  const sku = (await firstSkuLink.textContent())?.trim();

  if (!sku) {
    throw new Error("Expected at least one SKU row on the dashboard.");
  }

  await page.getByLabel(/Open SKU workbench/i).fill(sku);
  await page.locator(".sku-search__form").getByRole("button", { name: /Open/i }).click();

  await expect(page).toHaveURL(new RegExp(`/sku/${sku}`));
  await expect(page.getByRole("heading", { name: sku })).toBeVisible();
});

test("sku summary rows and demand drivers drawer open the sku workbench", async ({ page }) => {
  await page.goto("/");

  const firstSkuLink = page.locator("tbody tr").first().locator("a").first();
  await expect(firstSkuLink).toBeVisible();
  await firstSkuLink.click();

  await expect(page).toHaveURL(/\/sku\//);
  const driversToggle = page.getByRole("button", { name: /Toggle demand drivers panel/i });
  await expect(driversToggle).toBeVisible();
  await driversToggle.click();

  await expect(page.getByRole("heading", { name: /Price and in-stock projections/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Average unit price/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Customer in-stock/i })).toBeVisible();
});

test("alert filter toggles on the sku summary table", async ({ page }) => {
  await page.goto("/");

  const filterButton = page.getByRole("button", { name: /Show only SKUs with alerts/i });
  await expect(filterButton).toBeVisible();
  await filterButton.click();

  await expect(page.getByRole("button", { name: /Showing only alerted SKUs/i })).toBeVisible();
});
