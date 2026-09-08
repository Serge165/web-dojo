import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import { PublishModal } from "./PublishModal";

jest.mock("axios");

const setup = (props) =>
  render(
    <PublishModal
      open
      onClose={jest.fn()}
      projectId="proj-1"
      projectName="Test Site"
      onEnsureSaved={jest.fn().mockResolvedValue("proj-1")}
      {...props}
    />
  );

beforeEach(() => {
  axios.get.mockReset();
  axios.post.mockReset();
  axios.get.mockResolvedValue({ data: [] }); // publish-presets
});

test("projects without the dashboard-login widget skip the password check entirely", async () => {
  setup({ hasDashboardLogin: false });
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("/publish-presets")));
  expect(screen.queryByTestId("publish-owner-password-gate")).not.toBeInTheDocument();
  expect(screen.getByTestId("publish-submit")).not.toBeDisabled();
});

test("a dashboard-login project with no owner password set blocks publish until one is set", async () => {
  axios.get.mockImplementation((url) => {
    if (url.includes("password-status")) return Promise.resolve({ data: { is_set: false } });
    return Promise.resolve({ data: [] });
  });
  axios.post.mockResolvedValue({ data: { ok: true } });

  setup({ hasDashboardLogin: true });

  await waitFor(() => expect(screen.getByTestId("publish-owner-password-gate")).toBeInTheDocument());
  expect(screen.getByTestId("publish-submit")).toBeDisabled();

  fireEvent.change(screen.getByTestId("publish-owner-password-input"), { target: { value: "hunter222" } });
  fireEvent.click(screen.getByTestId("publish-owner-password-set"));

  await waitFor(() => expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/dashboard/proj-1/set-password"),
    { password: "hunter222" }
  ));
  await waitFor(() => expect(screen.queryByTestId("publish-owner-password-gate")).not.toBeInTheDocument());
  expect(screen.getByTestId("publish-submit")).not.toBeDisabled();
});

test("a dashboard-login project that already has an owner password never shows the gate", async () => {
  axios.get.mockImplementation((url) => {
    if (url.includes("password-status")) return Promise.resolve({ data: { is_set: true } });
    return Promise.resolve({ data: [] });
  });

  setup({ hasDashboardLogin: true });

  await waitFor(() => expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("password-status")));
  expect(screen.queryByTestId("publish-owner-password-gate")).not.toBeInTheDocument();
  expect(screen.getByTestId("publish-submit")).not.toBeDisabled();
});
