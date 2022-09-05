/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import router from "../app/Router.js"

import Bills from "../containers/Bills.js"
import mockStore from "../__mocks__/store.js"
import userEvent from '@testing-library/user-event'
import { formatDate, formatStatus } from "../app/format.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon).toHaveClass('active-icon')
    })

    // Ce test ne couvre aucune ligne de Bills.js
    test("Then bills should be ordered from earliest to latest", () => {
      // Modification du test ici - Justification en soutenance
      const fixturesBills = bills.map((bill) => {
        return {
          ...bill,
          dateFormatee: bill.date
        }
      })
      document.body.innerHTML = BillsUI({ data: fixturesBills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("Quand je suis sur la page 'Mes notes de frais' et que je clique sur l'icône 'oeil' de la colonne 'Action'", () => {
    test("Alors la modale d'affichage du justificatif devrait s'ouvrir", () => {
      // On commence par simuler l'UI de la page initialisée avec les fixturesBills  
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      // Le constructeur de la classe Bills va ajouter le listener handleClickIconEye(icon) à chaque icône oeil.
      const testBills = new Bills({
        document,
        onNavigate: null,
        store: mockStore, // le store simulé du répertoire __mocks__
        localStorage: window.localStorage,
      })
      // On récupère sur l'UI une référence DOM de la première icône oeil
      // Si c'est OK pour elle, c'est OK pour les autres
      const iconEye = screen.getAllByTestId('icon-eye')[0]
      // Puis une référence à la modale. getByRole 
      const modaleFile = document.getElementById('modaleFile')
      // On vérifie qu'elle a bien la clase 'modal' qui fait qu'elle devrait avoir display:'none'
      expect(modaleFile).toHaveClass('modal')
      // expect(modaleFile).toHaveStyle({ display: 'none' }) => FAIL 
      // On lui applique style.display = 'none' car le style css de la classe 'modal' n'est pas appliqué
      modaleFile.style.display = 'none'
      $.fn.modal = (v) => { // on simule JQuery modal('show')
        if (v === 'show') modaleFile.style.display = 'block';
      }
      // On simule un click sur la première icône, ce qui va déclencher handleClickIconEye(icon)
      userEvent.click(iconEye)
      expect(modaleFile).toHaveStyle({ display: 'block' })
    })
  })

  describe("Quand je suis sur la page 'Mes notes de frais' et que je clique sur le bouton 'Nouvelle note de frais'", () => {
    test("Alors je devrais être conduit sur la page d'édition d'une nouvelle note de frais", () => {
      // On commence par simuler l'UI de la page initialisée avec les fixturesBills  
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const navigate = (v) => { // Fonction qui simule onNavigate() qui est à passer en paramètre du constructeur de Bills
        expect(v).toBe(ROUTES_PATH['NewBill']) // Bills.onNavigate('route') a bien reçu la bonne 'route'
      }
      // Le constructeur de la classe Bills va ajouter le listener handleClickNewBill() au bouton d'édition d'un nouveau bill.
      const testBills = new Bills({
        document,
        onNavigate: navigate,
        store: mockStore, // le store simulé du répertoire __mocks__
        localStorage: window.localStorage
      })
      const button = screen.getByTestId('btn-new-bill')
      const spy = jest.spyOn(testBills, 'onNavigate') // 'onNavigate' car 'handleClickNewBill' ne convient pas bien qu'il soit appelé
      // Simule un click sur 'button', ce qui déclenche handleClickNewBill(), qui à son tour appelle testBills.onNavigate(route) 
      userEvent.click(button)
      expect(spy).toHaveBeenCalled()
    })
  })

})

describe("Quand une instance de la classe Bills est créée avec un certain store", () => {
  const testBills = new Bills({
    document, // peu importe
    onNavigate: null, // peu importe
    store: mockStore, // le store simulé du répertoire __mocks__
    localStorage: window.localStorage // peu importe
  })

  test("Alors la fonction getBills() retourne correctement les bills du store", async () => {
    let mocked_bills = await mockStore.bills().list();
    let expectedBills = mocked_bills.map(bill => {
      return {
        ...bill,
        dateFormatee: formatDate(bill.date),
        status: formatStatus(bill.status)
      }
    })
    const recevedBills = await testBills.getBills()
    expect(expectedBills).toStrictEqual(recevedBills)
  })

})

// test d'intégration GET
describe("Quand je suis connecté en tant qu'Employee", () => {
  describe("Quand j'arrive sur la page des notes de frais", () => {
    test("Alors lorsque la page récupère les notes de frais de mock API GET tout ce passe bien", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router() // va définir window.onNavigate()
      window.onNavigate(ROUTES_PATH.Bills)
      const textButton = screen.findByText("Nouvelle note de frais")
      const name1 = screen.findByText("test1")
      const name2 = screen.findByText("encore")
      expect(textButton).toBeTruthy()
      expect(name1).toBeTruthy()
      expect(name2).toBeTruthy()
     
    })

    describe("Quand lorsque la page n'arrive pas à récupérer les notes de frais de mock API GET", () => {
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills = jest.fn()
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        const html = BillsUI({ error: "Erreur 404" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills = jest.fn()
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })
        const html = BillsUI({ error: "Erreur 500" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })

    })

  })

})


















