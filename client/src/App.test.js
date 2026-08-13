import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./components/Editor", () => function MockEditor() {
  return <main><span>WriteFlow</span><button>Show outline</button></main>;
});

test("renders the WriteFlow editor workspace", async () => {
  render(<App />);
  expect(await screen.findByText("WriteFlow")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /show outline/i })).toBeInTheDocument();
});
