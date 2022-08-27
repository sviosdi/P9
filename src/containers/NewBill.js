import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    this.file = null
    new Logout({ document, localStorage, onNavigate })
  }

  handleChangeFile = e => {
    e.preventDefault()
    const fileInput = this.document.querySelector(`input[data-testid="file"]`)
    this.file = fileInput.files[0]
    const filePath = e.target.value.split(/\\/g)
    this.fileName = filePath[filePath.length-1]
    // Si le fichier n'est pas une image
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(this.file.type)) {
      if (!fileInput.nextElementSibling) {
        let div = this.document.createElement('div')
        div.textContent = "Vous ne pouvez joindre qu'un fichier dans l'un des formats suivants : jpeg, jpg, png ou gif."
        fileInput.after(div);
      }
      fileInput.value = null;
      return
    } else {
      if (fileInput.nextElementSibling) fileInput.nextElementSibling.remove();
    }
  }

  handleSubmit = e => {
    e.preventDefault()

    const formData = new FormData()
    const email = JSON.parse(localStorage.getItem("user")).email
    formData.append('file', this.file)
    formData.append('email', email)
    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .then(({ fileUrl, key }) => {
       // console.log(fileUrl) // toujours null ???
        this.billId = key
        this.fileUrl = fileUrl // toujours null ???  fileUrl n'est pas un champ de la réponse, par contre filePath en est un
        // this.fileName = fileName
        // console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
        const bill = {
          email,
          type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
          name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
          amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
          date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
          vat: e.target.querySelector(`input[data-testid="vat"]`).value,
          pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
          commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
          fileUrl: this.fileUrl, // ??? à construire avec filePath ?
          fileName: this.fileName,
          status: 'pending'
        }
        this.updateBill(bill)
        this.onNavigate(ROUTES_PATH['Bills'])   
      }).catch(error => console.error(error))
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills'])
        })
        .catch(error => console.error(error))
    }
  }
}