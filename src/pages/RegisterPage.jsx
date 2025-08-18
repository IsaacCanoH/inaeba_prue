import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import RegisterForm from "../components/Auth/RegisterForm"
import RegisterHeader from "../components/Auth/RegisterHeader"
import TermsModal from "../components/Auth/TermsModal"
import {
  getDirecciones,
  getCoordinacionesByDireccion,
  getJefaturasByCoordinacion,
  getHorarios,
  getMunicipios,
  getOficinas,
  getTipoBases,
  registrarEmpleado,
} from "../services/register/registerService"
import { useLoader } from "../context/LoaderContext"
import { useToast } from "../context/ToastContext"
import "bootstrap/dist/css/bootstrap.min.css"
import styles from "../styles/register.module.css"

const RegisterPage = () => {
  const navigate = useNavigate()
  const { showLoader, hideLoader } = useLoader()
  const { showError } = useToast()

  const [formData, setFormData] = useState({
    nombre: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    correoInstitucional: "",
    usuario: "",
    password: "",
    pin: "",
    direccion: "",
    coordinacion: "",
    jefatura: "",
    oficinas: "",
    tipoBase: "",
    grupo: "",
    municipio: "",
    telefono: "",
  })

  const [catalogos, setCatalogos] = useState({
    direcciones: [],
    coordinaciones: [],
    jefaturas: [],
    grupos: [],
    municipios: [],
    oficinas: [],
    tipoBases: [],
  })

  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

  const handleChange = useCallback(
    ({ target: { name, value, type, checked } }) => {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }))

      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }))
      }
    },
    [errors],
  )

  const validateForm = useCallback(() => {
    const newErrors = {}
    let isValid = true

    const required = [
      ["nombre", "El nombre es obligatorio"],
      ["apellidoPaterno", "El apellido paterno es obligatorio"],
      ["apellidoMaterno", "El apellido materno es obligatorio"],
      ["correoInstitucional", "El correo es obligatorio"],
      ["usuario", "El usuario es obligatorio"],
      ["password", "La contraseña es obligatoria"],
      ["pin", "El PIN es obligatorio"],
      ["direccion", "Seleccione una dirección"],
      ["coordinacion", "Seleccione una coordinación"],
      ["jefatura", "Seleccione una jefatura"],
      ["oficinas", "Seleccione una oficina"],
      ["tipoBase", "Seleccione un tipo de base"],
      ["grupo", "Seleccione un horario"],
      ["municipio", "Seleccione un municipio"],
      ["telefono", "El teléfono es obligatorio"],
    ]

    required.forEach(([key, msg]) => {
      if (!formData[key]?.toString().trim()) {
        newErrors[key] = msg
        isValid = false
      }
    })

    if (formData.correoInstitucional && !formData.correoInstitucional.endsWith("@inaeba.edu.mx")) {
      newErrors.correoInstitucional = "El correo debe pertenecer al dominio inaeba.edu.mx"
      isValid = false
    }

    if (formData.pin?.length !== 4) {
      newErrors.pin = "El PIN debe tener 4 dígitos"
      isValid = false
    }

    if (formData.telefono?.length !== 10) {
      newErrors.telefono = "El teléfono debe tener 10 dígitos"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }, [formData])

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [direcciones, horarios, municipios, oficinas, tipoBases] = await Promise.all([
          getDirecciones(),
          getHorarios(),
          getMunicipios(),
          getOficinas(),
          getTipoBases(),
        ])

        setCatalogos((prev) => ({
          ...prev,
          direcciones,
          grupos: horarios,
          municipios,
          oficinas,
          tipoBases,
        }))
      } catch (err) {
        console.error("Error al cargar catálogos:", err)
      }
    }

    cargarCatalogos()
  }, [])

  useEffect(() => {
    const fetchCoordinaciones = async () => {
      if (!formData.direccion) {
        setCatalogos((prev) => ({ ...prev, coordinaciones: [] }))
        return
      }

      try {
        const data = await getCoordinacionesByDireccion(formData.direccion)
        setCatalogos((prev) => ({ ...prev, coordinaciones: data }))
      } catch (err) {
        console.error("Error al cargar coordinaciones:", err)
      }
    }

    fetchCoordinaciones()
  }, [formData.direccion])

  useEffect(() => {
    const fetchJefaturas = async () => {
      if (!formData.coordinacion) {
        setCatalogos((prev) => ({ ...prev, jefaturas: [] }))
        return
      }

      try {
        const data = await getJefaturasByCoordinacion(formData.coordinacion)
        setCatalogos((prev) => ({ ...prev, jefaturas: data }))
      } catch (err) {
        console.error("Error al cargar jefaturas:", err)
      }
    }

    fetchJefaturas()
  }, [formData.coordinacion])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    // Mostrar modal de términos y condiciones
    setShowTermsModal(true)
  }

  const handleTermsAccept = async () => {
    setShowTermsModal(false)

    const payload = prepararFormData(formData)

    try {
      showLoader("Registrando datos...")
      await registrarEmpleado(payload)
      navigate("/login", { state: { registered: true } })
    } catch (err) {
      console.error("Error al registrar usuario:", err.message)
      showError("Error al registrar usuario")
    } finally {
      hideLoader()
    }
  }

  const handleTermsReject = () => {
    setShowTermsModal(false)
    // No hacer nada más, simplemente cerrar el modal
  }

  return (
    <div className="container-fluid p-0 min-vh-100">
      <RegisterHeader styles={styles} />
      <div className="row g-0 justify-content-center py-4">
        <div className="col-12 d-flex justify-content-center">
          <div className="w-100 px-3 px-sm-4 px-lg-5" style={{ maxWidth: "1000px" }}>
            <RegisterForm
              formData={formData}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              direccionOptions={catalogos.direcciones}
              coordinacionOptions={catalogos.coordinaciones}
              jefaturaOptions={catalogos.jefaturas}
              gruposOptions={catalogos.grupos}
              municipioOptions={catalogos.municipios}
              oficinaOptions={catalogos.oficinas}
              tipoBasesOptions={catalogos.tipoBases}
              errors={errors}
              styles={styles}
            />
          </div>
        </div>
      </div>

      <TermsModal show={showTermsModal} onAccept={handleTermsAccept} onReject={handleTermsReject} styles={styles} />
    </div>
  )
}

export default RegisterPage

const prepararFormData = (form) => {
  const data = new FormData()

  data.append("nombre", form.nombre)
  data.append("ap_paterno", form.apellidoPaterno)
  data.append("ap_materno", form.apellidoMaterno)
  data.append("email", form.correoInstitucional)
  data.append("usuario", form.usuario)
  data.append("clave_acceso", form.password)
  data.append("ping_hash", form.pin)
  data.append("id_direccion", Number.parseInt(form.direccion))
  data.append("id_coordinacion", Number.parseInt(form.coordinacion))
  data.append("id_jefatura", Number.parseInt(form.jefatura))
  data.append("id_oficina", Number.parseInt(form.oficinas))
  data.append("id_tipo_usuario", Number.parseInt(form.tipoBase))
  data.append("ig_grupo_horario", Number.parseInt(form.grupo))
  data.append("id_municipio", Number.parseInt(form.municipio))
  data.append("telefono", form.telefono)

  return data
}
