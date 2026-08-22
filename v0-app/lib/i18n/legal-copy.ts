import type { Locale } from "./dictionaries"

type Section = { title: string; body: string }
type LegalDocument = { eyebrow: string; title: string; updated: string; intro: string; sections: Section[]; contact: string }

export const LEGAL_COPY: Record<Locale, { privacy: LegalDocument; terms: LegalDocument; privacyLink: string; termsLink: string }> = {
  en: {
    privacyLink: "Privacy", termsLink: "Terms",
    privacy: { eyebrow:"HEGEVA AI · LEGAL", title:"Privacy notice", updated:"Last updated: 22 August 2026", intro:"This notice explains what information HEGEVA AI currently processes and why.", sections:[
      {title:"Information we process",body:"We process account details, authentication records, workspace content you choose to save, AI requests and usage counts, and information submitted through the contact form."},
      {title:"How we use it",body:"We use this information to provide and secure the service, keep account data separated, operate requested features, enforce usage limits, respond to enquiries, and diagnose faults."},
      {title:"Storage and service providers",body:"Application data is stored using Cloudflare services. Authentication, AI processing and optional email or payment services may process only the information required for their function. We do not claim to sell personal information."},
      {title:"Retention and control",body:"We keep data only while it is reasonably needed to operate, secure or improve the service and meet applicable obligations. You may request access, correction or deletion through the contact page."},
      {title:"Security and limits",body:"We use access controls and encrypted network connections. No online service can promise absolute security, so never submit passwords, API keys, payment credentials or other secrets through free-text forms."}
    ],contact:"Privacy questions or requests can be sent through the HEGEVA contact page."},
    terms: {eyebrow:"HEGEVA AI · LEGAL",title:"Terms of use",updated:"Last updated: 22 August 2026",intro:"These terms apply when you access or use the current HEGEVA AI preview and working services.",sections:[
      {title:"Service status",body:"HEGEVA is under active development. Features marked Working are available in their described scope; Beta, Planned and Coming Soon features may change or may not yet be available."},
      {title:"Your account and content",body:"You are responsible for accurate account information, protecting your login, and the content you submit. Only upload or process content you are entitled to use."},
      {title:"Acceptable use",body:"Do not misuse the service, bypass limits, interfere with security, access another user’s data, submit unlawful content, distribute malware, or use the service to deceive or harm others."},
      {title:"AI and business information",body:"AI output can be incomplete or incorrect and is not professional legal, tax, financial or medical advice. Review important output and obtain qualified advice where appropriate before acting."},
      {title:"Availability and changes",body:"We may repair, improve, limit or discontinue features. We aim to describe the service honestly, but uninterrupted or error-free availability is not guaranteed."},
      {title:"Contact",body:"Questions about these terms can be submitted through the contact page."}
    ],contact:"By continuing to use the service, you agree to follow these terms."}
  },
  hu: {
    privacyLink:"Adatvédelem",termsLink:"Felhasználási feltételek",
    privacy:{eyebrow:"HEGEVA AI · JOGI",title:"Adatvédelmi tájékoztató",updated:"Utolsó frissítés: 2026. augusztus 22.",intro:"Ez a tájékoztató bemutatja, hogy a HEGEVA AI jelenleg milyen adatokat kezel és miért.",sections:[
      {title:"Kezelt adatok",body:"Kezeljük a fiókadatokat, hitelesítési rekordokat, az általad mentett munkaterületi tartalmat, az AI-kéréseket és használati számlálókat, valamint a kapcsolatfelvételi űrlapon megadott adatokat."},
      {title:"Az adatkezelés célja",body:"Az adatokat a szolgáltatás működtetésére és védelmére, a fiókok elkülönítésére, a kért funkciók biztosítására, a használati korlátok kezelésére, a megkeresések megválaszolására és hibakeresésre használjuk."},
      {title:"Tárolás és szolgáltatók",body:"Az alkalmazás adatait Cloudflare-szolgáltatások tárolják. A hitelesítési, AI-, opcionális e-mail- vagy fizetési szolgáltatók csak a feladatukhoz szükséges adatokat kezelhetik. Nem állítjuk, hogy személyes adatokat értékesítünk."},
      {title:"Megőrzés és jogaid",body:"Az adatokat csak addig őrizzük, amíg az a szolgáltatás működtetéséhez, biztonságához, fejlesztéséhez vagy kötelezettségeink teljesítéséhez indokolt. Hozzáférést, helyesbítést vagy törlést a Kapcsolat oldalon kérhetsz."},
      {title:"Biztonság és korlátok",body:"Hozzáférés-védelmet és titkosított hálózati kapcsolatot használunk. Egyetlen online szolgáltatás sem garantálhat teljes biztonságot, ezért szabad szöveges mezőben ne adj meg jelszót, API-kulcsot, fizetési adatot vagy más titkot."}
    ],contact:"Adatvédelmi kérdésedet vagy kérelmedet a HEGEVA Kapcsolat oldalán küldheted el."},
    terms:{eyebrow:"HEGEVA AI · JOGI",title:"Felhasználási feltételek",updated:"Utolsó frissítés: 2026. augusztus 22.",intro:"Ezek a feltételek a HEGEVA AI jelenlegi előnézetének és működő szolgáltatásainak használatára vonatkoznak.",sections:[
      {title:"A szolgáltatás állapota",body:"A HEGEVA aktív fejlesztés alatt áll. A Dolgozó jelölésű funkciók a leírt körben elérhetők; a Béta, Tervezett és Hamarosan funkciók változhatnak vagy még nem használhatók."},
      {title:"Fiókod és tartalmad",body:"Te felelsz a pontos fiókadatokért, a belépésed védelméért és a beküldött tartalomért. Csak olyan tartalmat tölts fel vagy dolgozz fel, amelynek használatára jogosult vagy."},
      {title:"Megengedett használat",body:"Tilos a szolgáltatással visszaélni, korlátokat megkerülni, a biztonságot zavarni, más felhasználó adataihoz hozzáférni, jogellenes tartalmat vagy kártékony programot beküldeni, illetve megtévesztésre vagy károkozásra használni."},
      {title:"AI- és üzleti információk",body:"Az AI válasza hiányos vagy téves lehet, és nem minősül jogi, adózási, pénzügyi vagy egészségügyi szakvéleménynek. Fontos döntés előtt ellenőrizd az eredményt, és szükség esetén kérj képzett szakértői tanácsot."},
      {title:"Elérhetőség és változtatások",body:"Funkciókat javíthatunk, fejleszthetünk, korlátozhatunk vagy megszüntethetünk. Törekszünk az őszinte leírásra, de folyamatos és hibamentes működést nem garantálunk."},
      {title:"Kapcsolat",body:"A feltételekkel kapcsolatos kérdéseket a Kapcsolat oldalon küldheted el."}
    ],contact:"A szolgáltatás további használatával vállalod ezen feltételek betartását."}
  },
  de: {
    privacyLink:"Datenschutz",termsLink:"Nutzungsbedingungen",
    privacy:{eyebrow:"HEGEVA AI · RECHTLICHES",title:"Datenschutzhinweis",updated:"Letzte Aktualisierung: 22. August 2026",intro:"Dieser Hinweis erklärt, welche Informationen HEGEVA AI derzeit verarbeitet und warum.",sections:[
      {title:"Verarbeitete Informationen",body:"Wir verarbeiten Kontodaten, Authentifizierungsdaten, von Ihnen gespeicherte Arbeitsbereichsinhalte, KI-Anfragen und Nutzungszähler sowie Angaben aus dem Kontaktformular."},
      {title:"Verwendungszwecke",body:"Wir nutzen diese Daten, um den Dienst bereitzustellen und zu schützen, Konten zu trennen, angeforderte Funktionen auszuführen, Nutzungslimits anzuwenden, Anfragen zu beantworten und Fehler zu untersuchen."},
      {title:"Speicherung und Anbieter",body:"Anwendungsdaten werden über Cloudflare-Dienste gespeichert. Authentifizierungs-, KI-, optionale E-Mail- oder Zahlungsdienste verarbeiten nur die für ihre Funktion erforderlichen Daten. Wir behaupten nicht, personenbezogene Daten zu verkaufen."},
      {title:"Aufbewahrung und Kontrolle",body:"Daten werden nur so lange aufbewahrt, wie es für Betrieb, Sicherheit, Verbesserung oder geltende Pflichten angemessen erforderlich ist. Zugriff, Berichtigung oder Löschung können Sie über die Kontaktseite anfragen."},
      {title:"Sicherheit und Grenzen",body:"Wir verwenden Zugriffskontrollen und verschlüsselte Netzwerkverbindungen. Kein Onlinedienst kann absolute Sicherheit versprechen. Senden Sie daher keine Passwörter, API-Schlüssel, Zahlungsdaten oder andere Geheimnisse in Freitextfeldern."}
    ],contact:"Datenschutzfragen oder Anfragen können über die HEGEVA-Kontaktseite gesendet werden."},
    terms:{eyebrow:"HEGEVA AI · RECHTLICHES",title:"Nutzungsbedingungen",updated:"Letzte Aktualisierung: 22. August 2026",intro:"Diese Bedingungen gelten für die Nutzung der aktuellen HEGEVA-AI-Vorschau und der funktionierenden Dienste.",sections:[
      {title:"Dienststatus",body:"HEGEVA wird aktiv entwickelt. Als Funktionierend markierte Funktionen sind im beschriebenen Umfang verfügbar; Beta-, Geplant- und Demnächst-Funktionen können sich ändern oder noch nicht verfügbar sein."},
      {title:"Konto und Inhalte",body:"Sie sind für korrekte Kontodaten, den Schutz Ihrer Anmeldung und eingereichte Inhalte verantwortlich. Verarbeiten Sie nur Inhalte, zu deren Nutzung Sie berechtigt sind."},
      {title:"Zulässige Nutzung",body:"Missbrauchen Sie den Dienst nicht, umgehen Sie keine Limits, stören Sie keine Sicherheitsmaßnahmen, greifen Sie nicht auf fremde Daten zu und übermitteln Sie keine rechtswidrigen Inhalte oder Schadsoftware."},
      {title:"KI- und Geschäftsinformationen",body:"KI-Ausgaben können unvollständig oder falsch sein und sind keine professionelle Rechts-, Steuer-, Finanz- oder medizinische Beratung. Prüfen Sie wichtige Ergebnisse und holen Sie bei Bedarf qualifizierten Rat ein."},
      {title:"Verfügbarkeit und Änderungen",body:"Wir können Funktionen reparieren, verbessern, begrenzen oder einstellen. Wir beschreiben den Dienst nach bestem Wissen, garantieren aber keine ununterbrochene oder fehlerfreie Verfügbarkeit."},
      {title:"Kontakt",body:"Fragen zu diesen Bedingungen können über die Kontaktseite gesendet werden."}
    ],contact:"Mit der weiteren Nutzung erklären Sie sich bereit, diese Bedingungen einzuhalten."}
  },
  fr: {
    privacyLink:"Confidentialité",termsLink:"Conditions d’utilisation",
    privacy:{eyebrow:"HEGEVA AI · JURIDIQUE",title:"Avis de confidentialité",updated:"Dernière mise à jour : 22 août 2026",intro:"Cet avis explique quelles informations HEGEVA AI traite actuellement et pourquoi.",sections:[
      {title:"Informations traitées",body:"Nous traitons les données de compte et d’authentification, le contenu que vous enregistrez dans l’espace de travail, les demandes IA et compteurs d’utilisation, ainsi que les informations du formulaire de contact."},
      {title:"Utilisation",body:"Ces informations servent à fournir et sécuriser le service, séparer les comptes, exécuter les fonctions demandées, appliquer les limites, répondre aux demandes et diagnostiquer les incidents."},
      {title:"Stockage et prestataires",body:"Les données de l’application sont stockées avec les services Cloudflare. Les services d’authentification, d’IA, d’e-mail facultatif ou de paiement ne traitent que les données nécessaires à leur fonction. Nous ne prétendons pas vendre des données personnelles."},
      {title:"Conservation et contrôle",body:"Nous conservons les données uniquement pendant la durée raisonnablement nécessaire au fonctionnement, à la sécurité, à l’amélioration du service ou aux obligations applicables. Vous pouvez demander accès, rectification ou suppression via la page Contact."},
      {title:"Sécurité et limites",body:"Nous utilisons des contrôles d’accès et des connexions réseau chiffrées. Aucun service en ligne ne peut garantir une sécurité absolue : ne transmettez jamais mots de passe, clés API, données de paiement ou autres secrets dans un champ libre."}
    ],contact:"Les questions ou demandes de confidentialité peuvent être envoyées depuis la page Contact HEGEVA."},
    terms:{eyebrow:"HEGEVA AI · JURIDIQUE",title:"Conditions d’utilisation",updated:"Dernière mise à jour : 22 août 2026",intro:"Ces conditions s’appliquent à l’utilisation de l’aperçu HEGEVA AI et de ses services actuellement fonctionnels.",sections:[
      {title:"État du service",body:"HEGEVA est en développement actif. Les fonctions marquées Opérationnel sont disponibles dans le cadre décrit ; les fonctions Bêta, Planifié et Bientôt disponible peuvent changer ou ne pas être disponibles."},
      {title:"Compte et contenu",body:"Vous êtes responsable de l’exactitude de vos informations, de la protection de votre connexion et du contenu transmis. N’utilisez que du contenu que vous êtes autorisé à traiter."},
      {title:"Utilisation acceptable",body:"N’abusez pas du service, ne contournez pas les limites ou la sécurité, n’accédez pas aux données d’autrui et ne transmettez pas de contenu illégal ni de logiciel malveillant."},
      {title:"Informations IA et professionnelles",body:"Une réponse IA peut être incomplète ou erronée et ne constitue pas un conseil juridique, fiscal, financier ou médical professionnel. Vérifiez les résultats importants et consultez un professionnel qualifié si nécessaire."},
      {title:"Disponibilité et modifications",body:"Nous pouvons réparer, améliorer, limiter ou retirer des fonctions. Nous cherchons à décrire honnêtement le service, mais ne garantissons pas un fonctionnement continu ou sans erreur."},
      {title:"Contact",body:"Les questions sur ces conditions peuvent être envoyées via la page Contact."}
    ],contact:"En continuant à utiliser le service, vous acceptez de respecter ces conditions."}
  },
  es: {
    privacyLink:"Privacidad",termsLink:"Términos de uso",
    privacy:{eyebrow:"HEGEVA AI · LEGAL",title:"Aviso de privacidad",updated:"Última actualización: 22 de agosto de 2026",intro:"Este aviso explica qué información procesa actualmente HEGEVA AI y por qué.",sections:[
      {title:"Información tratada",body:"Tratamos datos de cuenta y autenticación, el contenido que guardas en el espacio de trabajo, solicitudes de IA y contadores de uso, además de la información enviada mediante el formulario de contacto."},
      {title:"Cómo la utilizamos",body:"Usamos estos datos para prestar y proteger el servicio, separar cuentas, ejecutar las funciones solicitadas, aplicar límites de uso, responder consultas y diagnosticar fallos."},
      {title:"Almacenamiento y proveedores",body:"Los datos de la aplicación se almacenan mediante servicios de Cloudflare. Los servicios de autenticación, IA, correo opcional o pagos solo tratan los datos necesarios para su función. No afirmamos vender información personal."},
      {title:"Conservación y control",body:"Conservamos los datos solo mientras sea razonablemente necesario para operar, proteger o mejorar el servicio y cumplir obligaciones aplicables. Puedes solicitar acceso, corrección o eliminación desde la página de Contacto."},
      {title:"Seguridad y límites",body:"Utilizamos controles de acceso y conexiones de red cifradas. Ningún servicio en línea puede prometer seguridad absoluta; no envíes contraseñas, claves API, datos de pago u otros secretos en campos de texto libre."}
    ],contact:"Las preguntas o solicitudes de privacidad pueden enviarse desde la página de Contacto de HEGEVA."},
    terms:{eyebrow:"HEGEVA AI · LEGAL",title:"Términos de uso",updated:"Última actualización: 22 de agosto de 2026",intro:"Estos términos se aplican al uso de la versión preliminar actual y de los servicios funcionales de HEGEVA AI.",sections:[
      {title:"Estado del servicio",body:"HEGEVA está en desarrollo activo. Las funciones marcadas En funcionamiento están disponibles en el alcance descrito; las funciones Beta, Planificado y Próximamente pueden cambiar o no estar disponibles todavía."},
      {title:"Tu cuenta y contenido",body:"Eres responsable de la exactitud de tus datos, de proteger tu acceso y del contenido que envías. Usa únicamente contenido que tengas derecho a utilizar."},
      {title:"Uso aceptable",body:"No abuses del servicio, eludas límites, interfieras con la seguridad, accedas a datos ajenos, envíes contenido ilegal o malware, ni uses el servicio para engañar o causar daños."},
      {title:"Información de IA y negocio",body:"Las respuestas de IA pueden ser incompletas o incorrectas y no constituyen asesoramiento jurídico, fiscal, financiero o médico profesional. Revisa los resultados importantes y busca asesoramiento cualificado cuando corresponda."},
      {title:"Disponibilidad y cambios",body:"Podemos reparar, mejorar, limitar o retirar funciones. Procuramos describir el servicio con honestidad, pero no garantizamos disponibilidad ininterrumpida ni libre de errores."},
      {title:"Contacto",body:"Las preguntas sobre estos términos pueden enviarse desde la página de Contacto."}
    ],contact:"Al continuar usando el servicio, aceptas cumplir estos términos."}
  }
}
