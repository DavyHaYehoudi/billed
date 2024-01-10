/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
import $ from "jquery";

jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      // await waitFor(() => screen.getByTestId('icon-window'))
      // const windowIcon = screen.getByTestId('icon-window')
      const windowIcon = screen.getByTestId("icon-window");
      await waitFor(() => windowIcon);
      expect(windowIcon).toHaveClass("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      // document.body.innerHTML = BillsUI({ data: bills });
      // const dates = screen
      //   .getAllByText(
      //     /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
      //   )
      //   .map((a) => a.innerHTML);
      // const antiChrono = (a, b) => (a < b ? 1 : -1);
      // const datesSorted = [...dates].sort(antiChrono);
      // expect(dates).toEqual(datesSorted);
      // ****************************** Vérification avec une data factice du tri des dates ****************************** //
        // Dates fictives
        const fakeDates = [
          "2022-01-01",
          "2021-12-15",
          "2021-10-30",
        ];
  
        // Crée une liste de factures avec les dates fictives
        const fakeBills = fakeDates.map((date) => ({
          date,
        }));
  
        document.body.innerHTML = BillsUI({ data: fakeBills });
  
        // Récupère les dates affichées à l'écran
        const dates = screen
          .getAllByText(
            /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
          )
          .map((a) => a.innerHTML); //Extraie le contenu sélectionné par getAllByText
  
        // Tri des dates de manière antichronologique
        const antiChrono = (a, b) => (a < b ? 1 : -1);
        const datesSorted = [...dates].sort(antiChrono);
  
        // Vérifie que les dates affichées sont bien triées de manière antichronologique
        expect(dates).toEqual(datesSorted);
    });
  });
});
// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to the bills page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "employee@test.tld" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      //Appararition du titre
      await waitFor(() => screen.getByText("Mes notes de frais"));
      //Affichage des factures
      const bills = [
        {
          type: "Type 1",
          name: "Name 1",
          date: "2022-01-01",
          amount: 100,
          status: "Validé",
          fileUrl: "url1",
        },
        {
          type: "Type 2",
          name: "Name 2",
          date: "2022-01-02",
          amount: 150,
          status: "En attente",
          fileUrl: "url2",
        },
      ];

      document.body.innerHTML = BillsUI({
        data: bills,
        loading: false,
        error: null,
      });

      expect(document.body.innerHTML).toContain("Type 1");
      expect(document.body.innerHTML).toContain("Name 1");
      expect(document.body.innerHTML).toContain("2022-01-01");
      expect(document.body.innerHTML).toContain("100 €");
      expect(document.body.innerHTML).toContain("Validé");
      expect(document.body.innerHTML).toContain("Type 2");
      expect(document.body.innerHTML).toContain("Name 2");
      expect(document.body.innerHTML).toContain("2022-01-02");
      expect(document.body.innerHTML).toContain("150 €");
      expect(document.body.innerHTML).toContain("En attente");
    });
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "employee@test.tld",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {//une seule invocation de la fonction
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Dashboard);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
describe("When I click on one eye icon", () => {
  test("Then the modal should open", async () => {
    const billsPage = new Bills({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });

    document.body.innerHTML = BillsUI({ data: bills });

    const iconEyes = screen.getAllByTestId("icon-eye");
    const handleClickIconEye = jest.fn(billsPage.handleClickIconEye);
    const modale = document.getElementById("modaleFile");

    $.fn.modal = jest.fn(() => modale.classList.add("show"));// Crée un mock pour la fonction modal de jQuery

    iconEyes.forEach((iconEye) => {
      iconEye.addEventListener("click", () => handleClickIconEye(iconEye));
      userEvent.click(iconEye);
      expect(handleClickIconEye).toHaveBeenCalled();
      expect(modale).toHaveClass("show");
    });
  });
});
