<div align="center">

	<h1 style="margin-bottom:0.2rem">🧠 Order App — Brain2 API Demo</h1>
	<p style="margin-top:0">
		<img alt="Angular" src="https://img.shields.io/badge/Angular-20-E23237?logo=angular&logoColor=white" />
		<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" />
		<img alt="RxJS" src="https://img.shields.io/badge/RxJS-7.8-B7178C?logo=ReactiveX&logoColor=white" />
		<img alt="Node" src="https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white" />
	</p>

	<p><strong>Production-like Angular app showcasing Brain2 REST APIs:</strong> Orders, Label Layout Preview, Static Texts, Devices, Package Records, Jobs, and more.</p>
</div>

---

## ✨ Highlights

- Label Layout Preview with project/layout/PLU selection and live image preview
- Static Texts integration (ReadTextBlockAsync) with debug
- Robust error handling with client-side fallbacks and diagnostics panel
- Order Processing/ Management: create, edit, start/interrupt/finish/cancel, view
- Data Maintenance: View, Edit, Delete Articles (PLUs) and Static Texts
- Import PLUs and Static texts from CSV file with auto mapping. Template files downloadable from UI.
- Device capture and Package Records submission
- Dark theme styling

---



## 🔌 API Endpoints (used by the app)

- Auth: `POST /api/v1/token`
- Articles/Labeler: `GET/POST/PATCH /api/v1/articles/labeler`, `GET /api/v1/articles/{number}/labeler`
- Orders: `POST /api/v1/order-processing/orders`, lifecycle endpoints under `/api/v1/order-processing/...`
- Label Projects/Layouts/Preview: `GET /api/v1/label-projects`, `GET /api/v1/label-layouts`, `POST /api/v1/label-preview`
- Devices/Package Records: `GET /api/v1/devices`, `GET /api/v1/package-types`, `POST /api/v1/package-records`
- Extensions (Static Texts): `POST /extensions/api/StaticTexts/CreateAndUpdateStaticText`, `POST /extensions/api/StaticTexts/ReadTextBlockAsync`

Note: If your backend uses a different API version (e.g., v2), update the paths in the app where `/api/v1` is referenced, or centralize the prefix.


<div align="center" style="margin-top:1rem">
	<span style="font-size:1.1rem;color:#5e6ad2"><strong>Happy labeling and order managing!</strong></span>
</div>
