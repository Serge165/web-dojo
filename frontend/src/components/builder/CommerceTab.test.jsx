import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommerceTab } from "./CommerceTab";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const noop = () => {};
const baseProps = { onAddBlock: noop, onOpenPaymentBuilder: noop, onWireCatalog: noop, onAddCart: noop, onSavePaypalSecret: noop };

test("filling in all SMTP fields and saving calls onSaveSmtpConfig with the entered values", () => {
  const onSaveSmtpConfig = jest.fn();
  render(<CommerceTab {...baseProps} onSaveSmtpConfig={onSaveSmtpConfig} />);

  fireEvent.change(screen.getByTestId("smtp-host"), { target: { value: "smtp.example.com" } });
  fireEvent.change(screen.getByTestId("smtp-port"), { target: { value: "587" } });
  fireEvent.change(screen.getByTestId("smtp-username"), { target: { value: "user@example.com" } });
  fireEvent.change(screen.getByTestId("smtp-password"), { target: { value: "app-password" } });
  fireEvent.change(screen.getByTestId("smtp-from"), { target: { value: "store@example.com" } });
  fireEvent.click(screen.getByTestId("save-smtp-btn"));

  expect(onSaveSmtpConfig).toHaveBeenCalledWith("smtp.example.com", 587, "user@example.com", "app-password", "store@example.com");
});

test("saving with a missing field does not call onSaveSmtpConfig", () => {
  const onSaveSmtpConfig = jest.fn();
  render(<CommerceTab {...baseProps} onSaveSmtpConfig={onSaveSmtpConfig} />);
  fireEvent.click(screen.getByTestId("save-smtp-btn"));
  expect(onSaveSmtpConfig).not.toHaveBeenCalled();
});
