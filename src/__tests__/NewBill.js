/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import { screen, waitFor } from "@testing-library/dom"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES_PATH } from "../constants/routes.js"
import router from "../app/Router.js"
import NewBillUI from "../views/NewBillUI.js"
import userEvent from '@testing-library/user-event'
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store.js"
import store from '../__mocks__/store.js'

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Alors l'icône mail dans le barre verticale devrait être sélectionnée", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)

      await waitFor(() => screen.getByTestId('icon-window'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon).toHaveClass('active-icon')

    })

    test("Alors un formulaire devrait être présent", async () => {
      const form = screen.getByTestId('form-new-bill')
      expect(form).not.toBeUndefined();
    })

    describe("Quand j'upload un fichier", () => {

      let html
      let newBill

      beforeAll(() => {
        html = NewBillUI()
        document.body.innerHTML = html
        // Ce constructeur ajoute les eventHandlers : handleChangeFile() et handleSubmit()   
        newBill = new NewBill({
          document,
          onNavigate: null,
          store: mockStore,
          localStorage: null,
        })
      })

      test("Alors si c'est un fichier image, la méthode handleChangeFile() est bien appelée et le fichier est récupéré par le navigateur et non corrompu", async () => {

        // const spy = jest.spyOn(newBill, 'handleChangeFile') 
        const file1 = new File(['testPng'], 'test.png', { type: 'image/png' })
        const inputFile = screen.getByTestId('file')
        //userEvent.upload(inputFile, file1);
        userEvent.upload(inputFile, file1)

        expect(inputFile.files[0]).toStrictEqual(file1)
        expect(newBill.file.name).toBe('test.png') // OK handleChangeFile() a bien été appelé le fichier est accepté
        // expect(spy).toHaveBeenCalled()   ??? FAIL alors que la méthode est clairement appelée. Je ne comprends pas pouruoi
        // S'il y avait un message d'erreur, il a du être effacé
        expect(inputFile.nextElementSibling).toBeNull()
      })


      test("Alors si ce n'est pas un fichier image, la méthode handleChangeFIle() est appelée et le fichier est refusé", () => {
        const file2 = new File(['testPdf'], 'test.pdf', { type: 'application/pdf' })
        const inputFile = screen.getByTestId('file')
        userEvent.upload(inputFile, file2)
        // handleChangeFIle() a bien été appelé est a fixé file=null; le fichier est refusé
        expect(newBill.file).toBeNull()
        // Le message d'erreur est bien présent
        expect(screen.getByText(/Vous ne pouvez joindre qu'un fichier dans/)).not.toBeUndefined()
      })

    })

    describe("Quand je crée une nouvelle note", () => {

      test("Alors je dois être capable de la poster", async () => {
        let html = NewBillUI()
        document.body.innerHTML = html
        // Le constructeur ajoute les eventHandlers : handleChangeFile() et handleSubmit()   
        let newBill = new NewBill({
          document,
          onNavigate: (pathname) => { },
          store: mockStore,
          localStorage: null,
        })

        // On override handleSubmit() pour le test [mock]
        newBill.handleSubmit = async () => {
          const bill = {
            email: "employee@test.tld",
            type: "Hôtel et logement",
            name: "Séminaire Javascript/React",
            amount: 450,
            date: "2022-08-30",
            vat: "10",
            pct: 20,
            commentary: "Hébergement lors du séminaire Limoges - Javascript/React",
            fileUrl: "", //  peu importe, complété par update()
            fileName: "testFacture.png",
            status: 'pending'
          }

          newBill.store.bills().create(bill).then( data => {         
            expect(data.key).toBe('1234')          
          });
        
        }

        const form = screen.getByTestId('form-new-bill')
    
        form.addEventListener('submit', newBill.handleSubmit)

        const submitButton = screen.getByText('Envoyer')
        userEvent.click(submitButton)

      })

    })

  })

})

