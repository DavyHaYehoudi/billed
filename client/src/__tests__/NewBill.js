/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import "@testing-library/jest-dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);
const configNewBill = () => {
  return new NewBill({
    document,
    onNavigate: jest.fn(),
    store: mockStore,
    localStorage: localStorageMock,
  });
};
window.localStorage.setItem(
  "user",
  JSON.stringify({
    type: "Employee",
    email: "employee@test.tld",
  })
);

beforeEach(async () => {
  jest.resetAllMocks();
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();

  document.body.innerHTML = NewBillUI();
  window.onNavigate(ROUTES_PATH.NewBill);
});
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then an employee downloads a file with an allowed extension ", async () => {
      const newBill = configNewBill();
      const fakeFile = {
        name: "test.jpg",
      };
      const isExtensionValid = newBill.isExtensionValid(fakeFile.name, [
        "jpg",
        "jpeg",
        "png",
      ]);
      expect(isExtensionValid).toBe(true);

      //Simuler la création dans la data du fichier téléchargé
      const uploadMock = jest.fn().mockResolvedValue({
        fileUrl: "test-file-url",
        key: "test-key",
      });
      //Mock de l'appel POST API
      newBill.store.bills().create = uploadMock;

      // Simuler l'envoi du formulaire avec une extension valide
      userEvent.upload(
        screen.getByTestId("file"),
        new File(["file content"], "test.jpg")
      );

      // Vérifier si la fonction d'upload a été appelée
      expect(uploadMock).toHaveBeenCalledWith({
        data: expect.any(FormData),
        headers: {
          noContentType: true,
        },
      });
      // Vérifier des détails spécifiques après l'upload
      const { fileUrl, key } = await uploadMock.mock.results[0].value;
      expect(fileUrl).toBe("test-file-url");
      expect(key).toBe("test-key");
    });
    test("Then an employee downloads a file with an disallowed extension ", async () => {
      const newBill = configNewBill();
      const fakeFile = {
        name: "test.txt",
      };
      const isExtensionValid = newBill.isExtensionValid(fakeFile.name, [
        "jpg",
        "jpeg",
        "png",
      ]);
      expect(isExtensionValid).toBe(false);
      const uploadMock = jest.fn().mockResolvedValue({
        fileUrl: "test-file-url",
        key: "test-key",
      });

      newBill.store.bills().create = uploadMock;

      // Simuler l'envoi du formulaire avec une extension invalide
      userEvent.upload(
        screen.getByTestId("file"),
        new File(["file content"], "test.txt")
      );

      // Vérifier si la fonction d'upload n'a pas été appelée
      expect(uploadMock).not.toHaveBeenCalledWith({
        data: expect.any(FormData),
        headers: {
          noContentType: true,
        },
      });
    });
    test("Then an employee submits a new bill", async () => {
      const newBill = configNewBill();

      // Simuler la méthode create de la création de facture
      const createMock = jest.fn().mockResolvedValue({
        fileUrl: "test-file-url",
        key: "test-key",
      });
      newBill.store.bills().create = createMock;

      // Vérifier l'appel de la méthode updateBill
      jest.spyOn(newBill, "updateBill").mockImplementation(() => {});
      // Simuler des saisies de champs du formulaire
      userEvent.selectOptions(screen.getByTestId("expense-type"), "Transports");
      userEvent.type(screen.getByTestId("expense-name"), "Vol Paris Londres");
      userEvent.type(screen.getByTestId("datepicker"), "2022-01-01");
      userEvent.type(screen.getByTestId("amount"), "348");
      userEvent.type(screen.getByTestId("vat"), "70");
      userEvent.type(screen.getByTestId("pct"), "20");
      userEvent.type(screen.getByTestId("commentary"), "Business lunch");
      userEvent.upload(
        screen.getByTestId("file"),
        new File(["file content"], "test.jpg")
      );

      fireEvent.submit(screen.getByTestId("form-new-bill"));

      expect(createMock).toHaveBeenCalledWith({
        data: expect.any(FormData),
        headers: {
          noContentType: true,
        },
      });

      // Vérifier si la méthode updateBill est bien appelée
      expect(newBill.updateBill).toHaveBeenCalled();

      // Vérifier si la navigation vers la page Bills a eu lieu
      expect(newBill.onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
    });
  });
});
