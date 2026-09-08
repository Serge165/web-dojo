# Graph Report - web-dojo-main  (2026-09-02)

## Corpus Check
- Large corpus: 577 files · ~671,630 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 3058 nodes · 5683 edges · 272 communities (143 shown, 111 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 115 edges (avg confidence: 0.84)
- Token cost: 232,901 input · 0 output

## Community Hubs (Navigation)
- Block Edit Menu
- Backend SQLite Compat Layer
- Theme Gallery
- UI Component Library
- Starter Templates Data
- Builder Auth & JWT
- Builder Modals & Panels
- Block Edit Menu (Legacy)
- Commerce Checkout Backend
- Security Fixes Tests
- Commerce & Template CRUD
- Frontend Dependency Resolutions
- Code Editor Pane Sync
- Audit Fixes Tests
- Cart & Page Layouts
- Content Models (CMS)
- Site Auth Tests
- Zenero Content Models
- Menu Bar & Import/Export
- Export Pipeline Helpers
- Analytics Tests
- UI Primitives (Alerts/Badges)
- Frontend Dev Dependencies
- Background Media Panel
- Onboarding & Add Page UI
- Content Models Tests
- Social Media Integrations
- Commerce Orders Tests
- Tauri Desktop Packaging
- Project Auth & Creation
- Collections Data Model
- Project Templates Modal
- Animation Generator
- Text Effects Panel
- Order Confirmation Email Tests
- Block Region Migration Script
- UI Primitives (Dialogs)
- Dashboard Login Handoff Docs
- Contextual Block Editors
- Block Classification Script
- Blend & Divider Panels
- Outline View
- Content Model Update Schemas
- File Tree Import
- Template Validation Tests
- App Entry & Toaster
- Commerce Tab Panel
- Content Model List Endpoints
- URL Import & SSRF Guards
- Responsive Export Tests
- Superpowers Plans
- Frontend
- Components Ui
- Superpowers Specs
- Backend
- Lib Tests
- Backend Tests
- Backend Tests
- Backend Tests
- Src Lib
- Src Lib
- Components Ui
- Docs
- Lib Exporters
- Backend Tests
- Frontend
- Components Builder
- Src Lib
- Backend Tests
- Backend Models
- Backend
- Backend Tests
- Backend Tests
- Superpowers Plans
- Src Lib
- Src Lib
- Src Lib
- Superpowers Plans
- Backend Tests
- Backend Tests
- Backend Tests
- Backend Tests
- Docs
- Components Builder
- Components Ui
- Superpowers Plans
- Backend Models
- Backend Tests
- Superpowers Specs
- Components Ui
- Src Hooks
- Src Lib
- Src Lib
- Backend Models
- Superpowers Plans
- Src Lib
- Src Lib
- Components Builder
- Superpowers Specs
- Backend
- Memory
- Backend
- Backend Tests
- Backend Tests
- Src Lib
- Backend Models
- Docs
- Backend Tests
- Frontend
- Src Lib
- Src Lib
- Components Ui
- Src Lib
- Src Lib
- Src Lib
- Backend Tests
- Backend Tests
- Docs
- Docs
- Src Lib
- Components Ui
- Components Ui
- Components Ui
- Components Ui
- Components Ui
- Src Lib
- Superpowers Plans
- Src Tauri Capabilities
- Backend
- Backend Tests
- Backend Tests
- Backend Tests
- Backend Tests
- Frontend
- Frontend
- Plugins Health Check
- Components Ui
- Constants Testids
- Src Lib
- Src Lib
- Backend Tests
- Backend Tests
- Backend Tests
- Backend Tests
- Backend Tests
- Backend Tests
- Src Tauri Src
- Frontend
- Plugins Health Check
- Components Builder
- Components Builder
- Components Builder
- Src Lib
- Backend Tests
- Frontend
- Src Lib
- Backend
- Backend
- Backend Tests
- Backend Tests
- Backend Tests
- .emergent Cron
- Frontend Scripts
- Superpowers Plans
- .emergent Cron
- Frontend Scripts
- Src Lib
- Frontend
- Superpowers Plans
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Superpowers Plans
- Superpowers Plans
- Frontend
- .emergent Cron
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Frontend
- Components Builder
- Src Lib
- Src Tauri Icons
- Src Tauri Icons
- Src Tauri Icons
- Src Tauri Icons
- Src Tauri Icons
- Src Tauri Icons
- Src Tauri Icons
- Src Tauri Icons
- Src Tauri Icons
- Src Tauri Icons
- CORS Wildcard-With-Credentials Fix
- data-wd-stack Opt-In Attribute
- Remove Hardcoded Stripe Fallback Key
- Live Classed Rendering Design
- Emergent System Dependencies
- Frontend README (CRA boilerplate)
- app
- Web Dojo README
- Web Dojo App Icon (Square284x284Logo.png)
- Web Dojo app icon (Windows Store tile, 30x30)
- Web Dojo App Icon (Square71x71Logo.png)
- Web Dojo App Icon (Square89x89Logo.png)

## God Nodes (most connected - your core abstractions)
1. `cn()` - 199 edges
2. `_require_dashboard_token()` - 56 edges
3. `_page()` - 49 edges
4. `_tpl()` - 48 edges
5. `resolutions` - 43 edges
6. `Builder()` - 41 edges
7. `escAttr()` - 28 edges
8. `DialogContent` - 27 edges
9. `buildStandaloneHtml()` - 27 edges
10. `buildMultiPageExport()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `JS/Python Mirrored-Function-Pair Convention` --semantically_similar_to--> `frontend/scripts/wrap-block-bg-vars.mjs`  [INFERRED] [semantically similar]
  docs/superpowers/plans/2026-08-24-export-ssg-plan.md → frontend/docs/superpowers/plans/2026-08-30-block-editor-refactor.md
- `/api/submissions Unscoped GET/DELETE Fix` --rationale_for--> `list_submissions()`  [EXTRACTED]
  docs/superpowers/specs/2026-08-17-audit-fix-round-2-design.md → backend/server.py
- `CodeView Four-Tab CodePen Redesign` --rationale_for--> `CodeView()`  [EXTRACTED]
  docs/superpowers/specs/2026-08-18-codepen-editor-design.md → frontend/src/components/builder/CodeView.jsx
- `/api/submissions Unscoped GET/DELETE Fix` --rationale_for--> `SubmissionsModal()`  [EXTRACTED]
  docs/superpowers/specs/2026-08-17-audit-fix-round-2-design.md → frontend/src/components/builder/SubmissionsModal.jsx
- `CSS Pane Live Two-Way Sync` --rationale_for--> `reconcileElementsFromCss()`  [EXTRACTED]
  docs/superpowers/specs/2026-08-18-codepen-editor-design.md → frontend/src/lib/cssPaneSync.js

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Round-1 Security Fixes (SSRF, CORS, Stripe key, Fernet perms)** — concept_ssrf_import_url_fix, concept_cors_misconfiguration_fix, concept_stripe_hardcoded_key_fix, concept_fernet_key_permissions_fix [EXTRACTED 1.00]
- **Dashboard endpoints sharing the X-Dashboard-Token gate** — po_plan_dashboard_password_endpoints, po_plan_orders_list_endpoint, an_plan_revenue_funnel_endpoint, in_plan_stale_revenue_drop, ce_plan_customer_aggregation_endpoint [INFERRED 0.85]
- **First-write-open, token-gated-replace encrypted credential storage pattern** — po_plan_paypal_secret_endpoint, ce_plan_smtp_config_endpoint, po_plan_dashboard_password_endpoints [INFERRED 0.85]
- **Round-2 Audit-Findings Fixes** — concept_submissions_scoping_fix, concept_jpy_zero_decimal_fix, concept_publish_path_traversal_fix, concept_submission_body_size_cap, concept_escapehtml_shared_utility, concept_iframe_sandbox_fix, concept_setattr_replace_pattern_bug [EXTRACTED 1.00]
- **Shared HTML-Assembly Injection Points (custom_js + RESPONSIVE_CSS)** — backend_server__project_to_html, backend_server__build_project_bundle, frontend_src_lib_exporthtml_buildstandalonehtml, frontend_src_lib_exporthtml_buildcleanexport, concept_custom_js_field, concept_responsive_css_injection [EXTRACTED 1.00]
- **Four-phase e-commerce effort (payments -> customers/email -> analytics -> insights)** — po_spec, ce_spec, an_spec, in_spec [EXTRACTED 1.00]
- **Phase 9 Modernization Sub-phases** — concept_phase9_local_first_sync, concept_phase9_framework_exporters, concept_phase9_generic_collections, concept_phase9_animation_triggers, concept_phase9_realtime_collaboration, docs_phase9_implementation_handoff_doc, docs_phase9_spec_reconciliation_handoff_doc [INFERRED 0.85]
- **Semantic Block Class Naming Export Pipeline** — frontend_src_lib_stripinlinestyles_js, backend_server_py, frontend_src_lib_blockclassname_js, docs_phase_4_block_audit_doc, docs_globals_css_spec_doc, docs_html_template_spec_doc [INFERRED 0.85]
- **Token-gated Dashboard Auth Pattern Family** — backend_server_py, backend_models_site_auth_py, backend_models_builder_auth_py, backend_models_zenero_py, concept_dashboard_password_gate [INFERRED 0.75]
- **CMS Design/Plan Retirement Cluster (Superseded by Zenero Stack)** — docs_superpowers_plans_2026_08_24_export_ssg_plan_doc, docs_superpowers_plans_2026_08_24_native_cms_core_2a_data_model_plan_doc, docs_superpowers_plans_2026_08_24_native_cms_core_2b_authoring_plan_doc, docs_superpowers_specs_2026_08_24_cms_template_layout_collections_design_doc, concept_zenero_stack [INFERRED 0.85]
- **Block Editor Refactor Design+Plan Implementation Cluster** — frontend_docs_superpowers_plans_2026_08_30_block_editor_refactor_doc, frontend_docs_superpowers_specs_2026_08_30_block_editor_refactor_design_doc, frontend_scripts_wrap_block_bg_vars_mjs, frontend_scripts_migrate_block_regions_mjs, concept_block_bg_image_css_var, concept_region_based_block_editing [INFERRED 0.85]
- **JS/Python Mirrored-Pair Architectural Convention Cluster** — concept_js_python_mirror_convention, frontend_src_lib_expandtemplates_js, backend_server_py, frontend_scripts_wrap_block_bg_vars_mjs, backend_block_styles_generated_py [INFERRED 0.65]

## Communities (272 total, 111 thin omitted)

### Community 0 - "Block Edit Menu"
Cohesion: 0.07
Nodes (73): BackgroundBlockEditor(), baseName(), BentoEditor(), BlockEditMenu(), buildBentoItem(), buildNavNode(), buildTimelineLi(), capturePosterFrame() (+65 more)

### Community 1 - "Backend SQLite Compat Layer"
Cohesion: 0.05
Nodes (39): Backend Python Dependencies (requirements.txt), _matches(), _project(), Narrow, drop-in-compatible SQLite shim for the subset of Motor's async MongoDB…, SqliteClient, SqliteCollection, SqliteCursor, SqliteDatabase (+31 more)

### Community 2 - "Theme Gallery"
Cohesion: 0.06
Nodes (48): CATEGORY_LABELS, CATEGORY_ORDER, ThemeGallery(), aestheticThemes, acidTrip, darkVoid, defaultTheme, glitchSynthwave (+40 more)

### Community 3 - "UI Component Library"
Cohesion: 0.06
Nodes (48): AccordionContent, AccordionItem, AccordionTrigger, Avatar, AvatarFallback, AvatarImage, Card, CardContent (+40 more)

### Community 4 - "Starter Templates Data"
Cohesion: 0.13
Nodes (55): Any, One-shot: dump backend/starter_templates.py STARTER_TEMPLATES to a JSON file…, _comments_section(), _esports_pages(), _esports_sections(), _page(), Curated starter templates seeded on backend boot. Each template is a self-…, Builds a full comment-thread section (heading+count, list, working client-only… (+47 more)

### Community 5 - "Builder Auth & JWT"
Cohesion: 0.07
Nodes (25): _auth_secret(), AuthRequest, _b64url(), _b64url_decode(), issue_jwt(), login(), logout(), BaseModel (+17 more)

### Community 6 - "Builder Modals & Panels"
Cohesion: 0.10
Nodes (29): AnalyticsModal(), BLOCK_PREFIX_BY_CAT, blockClass(), CodeEditor(), registerBlockClassActions(), FileEditorModal(), LANG_BY_EXT, languageFor() (+21 more)

### Community 7 - "Block Edit Menu (Legacy)"
Cohesion: 0.09
Nodes (46): baseName(), BentoEditor(), BlockEditMenu(), buildBentoItem(), buildNavNode(), buildTimelineLi(), chunkAt(), detectBlockKind() (+38 more)

### Community 8 - "Commerce Checkout Backend"
Cohesion: 0.08
Nodes (42): _analytics_window(), CheckoutSessionCreate, commerce_checkout_session(), commerce_payment_link(), _compute_customer_breakdown(), _compute_fulfillment_funnel(), _compute_returning_share_drop(), _compute_revenue_drop() (+34 more)

### Community 9 - "Security Fixes Tests"
Cohesion: 0.05
Nodes (13): client(), _Collection, _EmptyDb, fixture, Self-contained regression tests for the security fixes audit. Unlike…, Stands in for server.db so CORS tests can reach routes that do a find_one…, TestCORS, TestFernetKeyFilePermissions (+5 more)

### Community 10 - "Commerce & Template CRUD"
Cohesion: 0.07
Nodes (43): CheckoutItem, commerce_config(), create_component(), create_publish_preset(), create_snippet(), create_template(), _deserialize(), get_project() (+35 more)

### Community 11 - "Frontend Dependency Resolutions"
Cohesion: 0.05
Nodes (43): resolutions, **/anymatch/picomatch, **/axios/form-data, @babel/plugin-transform-modules-systemjs, **/cosmiconfig/yaml, **/css-loader/postcss, **/css-minimizer-webpack-plugin/postcss, **/cssnano/yaml (+35 more)

### Community 12 - "Code Editor Pane Sync"
Cohesion: 0.09
Nodes (28): _strip_inline_styles(), classedHtmlPaneSync Module, CodeView Four-Tab CodePen Redesign, CSS Pane Live Two-Way Sync, Clean-Export Grid Responsiveness Fix, HTML Pane Live Two-Way Sync, Live Classed Rendering (Derive, Don't Migrate), Stable Id-Based CSS Class Naming (+20 more)

### Community 13 - "Audit Fixes Tests"
Cohesion: 0.06
Nodes (12): client(), fixture, Self-contained regression tests for the second audit-fix round. Same TestClient…, Mock server.db.projects so _require_dashboard_token can find the project and…, Builder-telemetry endpoint: the frontend diagnostics layer batches client-side…, form_name is now a secondary filter — project_id is required and must be token-…, TestClientLogs, TestProjectIdInjection (+4 more)

### Community 14 - "Cart & Page Layouts"
Cohesion: 0.06
Nodes (16): buildCartRuntimeHtml(), btn(), cartRuntime(), features(), heroCenter(), heroImage(), heroSplit(), icon() (+8 more)

### Community 15 - "Content Models (CMS)"
Cohesion: 0.12
Nodes (39): Authenticate the caller and verify project-level permission. need: minimum role…, require_project_access(), create_portfolio_item(), create_post(), create_social_post(), delete_portfolio_item(), delete_post(), delete_social_post() (+31 more)

### Community 16 - "Site Auth Tests"
Cohesion: 0.09
Nodes (23): _b64url(), _b64url_decode(), issue_site_jwt(), BaseModel, get, post, Per-project customer accounts for exported static sites. Unlike builder_auth…, Same key material as builder/dashboard tokens, different derivation label. (+15 more)

### Community 17 - "Zenero Content Models"
Cohesion: 0.13
Nodes (37): BentoTile, BentoTileCreate, BlogPost, BlogPostCreate, create_bento_tile(), create_blog_post(), create_fixture(), create_gallery_item() (+29 more)

### Community 18 - "Menu Bar & Import/Export"
Cohesion: 0.13
Nodes (30): _esc_raw_script(), escRawScript / _esc_raw_script Helper, ImportExportModal(), MenuBar(), BLOCK_BASE_CSS, BLOCK_STYLES_BY_CATEGORY, BLOCK_STYLES_CSS, BLOCK_STYLES_MEDIA_CSS (+22 more)

### Community 19 - "Export Pipeline Helpers"
Cohesion: 0.06
Nodes (38): _active_page(), _block_class_name(), _bucket_css_by_category(), _build_google_fonts_link(), _build_json_ld(), _build_multi_page_bundle(), _build_organized_stylesheet(), _build_project_bundle() (+30 more)

### Community 20 - "Analytics Tests"
Cohesion: 0.11
Nodes (4): TestAnalyticsCustomerBreakdown, TestAnalyticsRevenueAndFunnel, TestCustomersEndpoint, TestInsightsStuckFulfillmentAndReturningShareDrop

### Community 21 - "UI Primitives (Alerts/Badges)"
Cohesion: 0.06
Nodes (21): Alert, AlertDescription, AlertTitle, alertVariants, Badge(), badgeVariants, Checkbox, HoverCardContent (+13 more)

### Community 22 - "Frontend Dev Dependencies"
Cohesion: 0.06
Nodes (35): autoprefixer, @babel/plugin-proposal-private-property-in-object, @craco/craco, dotenv, @emergentbase/visual-edits, eslint, @eslint/js, eslint-plugin-jsx-a11y (+27 more)

### Community 23 - "Background Media Panel"
Cohesion: 0.14
Nodes (21): Shared escapeHtml Utility, BackgroundMediaPanel(), buildMusicHtml(), CORNERS, POS_OPTIONS, SIZE_OPTIONS, selected, PaymentButtonModal() (+13 more)

### Community 24 - "Onboarding & Add Page UI"
Cohesion: 0.11
Nodes (21): iframe Sandbox allow-same-origin Fix, AddPageModal(), OnboardingTour(), STEPS, PublishModal(), StatusBar(), TemplateApplyModal(), TemplateEditor() (+13 more)

### Community 25 - "Content Models Tests"
Cohesion: 0.16
Nodes (12): client(), no_dash_gate(), _noop(), _project(), fixture, Phase 2 regression tests: blog posts, social wall, portfolio projects., Patch the dashboard-token gate so social-post tests don't need a full password…, _register() (+4 more)

### Community 26 - "Social Media Integrations"
Cohesion: 0.17
Nodes (28): AsyncClient, _cache_get(), _cache_set(), fetch_facebook_comments(), fetch_facebook_feed(), fetch_instagram_feed(), fetch_linkedin_feed(), fetch_tiktok_feed() (+20 more)

### Community 27 - "Commerce Orders Tests"
Cohesion: 0.08
Nodes (16): auth(), client(), _commerce_test_env(), db(), paypal_project_id(), project_id(), fixture, Scope this module's DB + Stripe overrides so they don't leak to other test… (+8 more)

### Community 28 - "Tauri Desktop Packaging"
Cohesion: 0.07
Nodes (28): ../backend/dist/webdojo-backend, deb, icons/128x128@2x.png, icons/128x128.png, icons/32x32.png, icons/icon.icns, icons/icon.ico, rpm (+20 more)

### Community 29 - "Project Auth & Creation"
Cohesion: 0.11
Nodes (27): authenticate(), Resolve the Authorization: Bearer header to a user document. Raises 401 when…, _cap_request_body(), claim_project(), create_project(), create_submission(), DashboardPasswordRequest, _extract_submission() (+19 more)

### Community 30 - "Collections Data Model"
Cohesion: 0.15
Nodes (25): CollectionDef, CollectionDefCreate, CollectionDefUpdate, CollectionItemCreate, CollectionItemUpdate, create_collection(), create_collection_item(), delete_collection() (+17 more)

### Community 31 - "Project Templates Modal"
Cohesion: 0.14
Nodes (17): AESTHETIC_PREVIEWS, filePageMeta(), ImportTemplatePanel(), pagesToProjectData(), ProjectTemplatesModal(), readFileAsText(), sectionsToProjectData(), TemplatePreviewModal() (+9 more)

### Community 32 - "Animation Generator"
Cohesion: 0.19
Nodes (21): AnimationGenerator(), ANIMATION_CATEGORIES, ANIMATION_LIBRARIES, ANIMATION_PRESETS, ANIMATION_TRIGGERS, buildAnimationShorthand(), buildAppliedAnimation(), buildClickBootstrapScript() (+13 more)

### Community 33 - "Text Effects Panel"
Cohesion: 0.12
Nodes (16): addClassToRootTag(), ANIM_FX, COPY_PROPS, cssStr(), FX_PROPS, HOVER_FX, isNeutral(), libPreview() (+8 more)

### Community 34 - "Order Confirmation Email Tests"
Cohesion: 0.13
Nodes (7): _fake_line_items(), _fake_paypal_order(), _fake_stripe_event(), TestConfirmationEmailFiresOnNewOrder, TestOrdersGetAFulfillmentStatusOnCreation, TestPaypalVerify, TestStripeWebhook

### Community 35 - "Block Region Migration Script"
Cohesion: 0.14
Nodes (12): applyMigrationToSource(), findGalleryGridDiv(), isNavOrFooter(), main(), markContentRegion(), markHeading(), NOTE: replacer must be a function so `finalHtml` is inserted, CORE_CATEGORIES (+4 more)

### Community 36 - "UI Primitives (Dialogs)"
Cohesion: 0.13
Nodes (18): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+10 more)

### Community 37 - "Dashboard Login Handoff Docs"
Cohesion: 0.15
Nodes (21): builder_auth.py, site_auth.py, server.py, Per-project Dashboard Password Gate, Dashboard Stack Disconnection Finding, data-forge-dashboard-copy Flavor-text JSON, E-commerce Dashboard System (4 phases), globals.css Canonical Section Structure (+13 more)

### Community 38 - "Contextual Block Editors"
Cohesion: 0.19
Nodes (17): setAttr/setInnerText String.replace Pattern Bug, ButtonEditor(), CardEditor(), ContextualEditors(), detectKind(), FlexContainerEditor(), GridContainerEditor(), ImageEditor() (+9 more)

### Community 39 - "Block Classification Script"
Cohesion: 0.11
Nodes (19): allBlocks, allMediaCss, BLOCKS_EXTRA_JS, BLOCKS_JS, byCategoryLines, catEntries, collisions, cssByCat (+11 more)

### Community 40 - "Blend & Divider Panels"
Cohesion: 0.14
Nodes (14): BLEND_MODES, BlendPanel(), buildSvg(), DividerPanel(), DIVIDERS, RightSidebar(), TABS, parseNumber() (+6 more)

### Community 41 - "Outline View"
Cohesion: 0.26
Nodes (17): OutlineView(), uid(), buildOutlineFromElements(), buildOutlineFromPage(), buildOutlineFromPageHtml(), buildOutlineSlidesFromPage(), _decodeEntities(), _ENTITIES (+9 more)

### Community 42 - "Content Model Update Schemas"
Cohesion: 0.14
Nodes (20): BentoTileUpdate, BlogPostUpdate, _deserialize(), FixtureUpdate, GalleryItemUpdate, OrgStatUpdate, PortfolioItemUpdate, put (+12 more)

### Community 43 - "File Tree Import"
Cohesion: 0.25
Nodes (16): buildTree(), FileTree(), importedPath(), isImageFile(), mergeImported(), readEntry(), readFileContent(), uid() (+8 more)

### Community 44 - "Template Validation Tests"
Cohesion: 0.19
Nodes (18): _check_tag_balance(), _internal_html_links(), Quality-assurance pipeline for Web Dojo starter templates (Task 4.1).…, Remove <script>/<style> bodies so their JS/CSS (which contains `<>`) can't be…, Count open vs close for each element (void + self-closing tags need no close)…, Bare '*.html' targets from href attributes; ignores anchors/external., _source(), _strip_raw_blocks() (+10 more)

### Community 45 - "App Entry & Toaster"
Cohesion: 0.22
Nodes (14): App(), Toaster(), queryClient, root, clearDiagnosticsForTests(), flush(), getBufferedEvents(), initDiagnostics() (+6 more)

### Community 46 - "Commerce Tab Panel"
Cohesion: 0.22
Nodes (11): CommerceTab(), baseProps, ComponentThumbnail(), FormsTab(), useHoverPreview(), GROUPS, LeftSidebar(), SnippetsTab() (+3 more)

### Community 47 - "Content Model List Endpoints"
Cohesion: 0.16
Nodes (18): list_bento_tiles(), list_blog_posts(), list_fixtures(), list_gallery_items(), list_org_stats(), list_portfolio_items(), list_roster_players(), list_timeline_entries() (+10 more)

### Community 48 - "URL Import & SSRF Guards"
Cohesion: 0.13
Nodes (18): _resolve_is_public(), _validate_import_url(), clear_submissions(), import_url(), _inline_external_stylesheets(), Resolve hostname to a single public IP. Raises HTTPException if it cannot be…, Validate `url` is a safe, public http(s) URL and pin its connection to the…, Fetch `url` through the same SSRF-safe path as the main page fetch below (every… (+10 more)

### Community 49 - "Responsive Export Tests"
Cohesion: 0.11
Nodes (3): Regression tests for the responsive-export fix. Pure-function tests — no…, TestCleanExportGridResponsive, TestResponsiveCss

### Community 50 - "Superpowers Plans"
Cohesion: 0.12
Nodes (18): New beautifulsoup4 Backend Dependency (proposed), blog_post Default Collection Fields, Collection/Layout/Template/Page Terminology, Convert to Template Import-Detection Algorithm, Dashboard data/ Prefix File-Based Content Model, Dashboard Tabs: Overview/Blog/Updates/Bento/Timeline/Ecommerce, JS/Python Mirrored-Function-Pair Convention, portfolio_project Default Collection Fields (+10 more)

### Community 51 - "Frontend"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 52 - "Components Ui"
Cohesion: 0.14
Nodes (12): Canvas(), VIEWPORT_WIDTHS, InlineToolbar(), ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem (+4 more)

### Community 53 - "Superpowers Specs"
Cohesion: 0.16
Nodes (17): backend/block_styles_generated.py, backend/tests/test_block_styles_generated.py, --block-bg-image CSS Custom Property Override, detectBlockShape: nav/container/section Structural Detection, Retired Exclusive Kind Dispatch (KIND_LABELS/GENERIC_KINDS), Multi-page Nav Inconsistency Bug, Phase 4b Class-Based CSS Conversion (commit deb6bcc), Composable Region-Based Block Editing (+9 more)

### Community 54 - "Backend"
Cohesion: 0.12
Nodes (17): Store social API tokens encrypted in project settings., save_social_config(), _dashboard_token_secret(), _encrypt(), _get_fernet(), _issue_dashboard_token(), PaypalSecretRequest, Store social API tokens encrypted in project settings (never in exported HTML).… (+9 more)

### Community 55 - "Lib Tests"
Cohesion: 0.17
Nodes (13): _build_project_bundle(), _project_to_html(), RESPONSIVE_CSS (backend constant), custom_js Page Field, Shared HTML-Assembly Injection Points, RESPONSIVE_CSS Injection Mechanism, CATEGORIES, RESPONSIVE_CSS (+5 more)

### Community 56 - "Backend Tests"
Cohesion: 0.12
Nodes (7): client(), fixture, parametrize, Tests for the Phase 2D asset upload endpoint. Uses WEBDOJO_ASSETS_DIR (via…, Phase: video upload feature validation. asset_type=video gets its own MIME…, TestAssetUpload, TestVideoUpload

### Community 58 - "Backend Tests"
Cohesion: 0.12
Nodes (7): client(), project(), fixture, Tests for the esports Zenero content types (models/zenero.py): roster players,…, TestFixtures, TestOrgStats, TestRosterPlayers

### Community 59 - "Src Lib"
Cohesion: 0.25
Nodes (11): ColorPicker(), PatternPanel(), clamp(), hexToRgb(), hslToRgb(), rgbaString(), rgbToHex(), rgbToHsl() (+3 more)

### Community 60 - "Src Lib"
Cohesion: 0.21
Nodes (12): SearchResultPreview(), SEOValidator(), FIELDS, OG_TYPES, SCHEMA_TYPES, STATUS_COLOR, STATUS_ICON, descriptionCountColor() (+4 more)

### Community 61 - "Components Ui"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 62 - "Docs"
Cohesion: 0.13
Nodes (16): collections.py, framework_export.py, zenero.py, Phase 9D Animation Triggers (hover/click), Phase 9C Framework Exporters (Astro/Next.js), Phase 9B Generic Collections, Phase 9E Local-First Sync, Phase 9 Implementation Handoff (+8 more)

### Community 63 - "Lib Exporters"
Cohesion: 0.23
Nodes (11): ExporterModal(), zipAndDownload(), buildAstroExport(), markInlineScripts(), pkgName(), rewriteAssetPaths(), buildNextjsExport(), headParts() (+3 more)

### Community 64 - "Backend Tests"
Cohesion: 0.22
Nodes (9): _FakeClient, _FakeDb, _install_fakes(), Regression tests for the process-global DB client lifecycle fix (Task: "backend…, test_build_client_returns_pair(), test_ensure_live_client_is_noop_when_not_closed(), test_ensure_live_client_rebuilds_after_close(), test_shutdown_handler_closes_and_marks_closed() (+1 more)

### Community 65 - "Frontend"
Cohesion: 0.13
Nodes (15): cmdk, dependencies, cmdk, jszip, lucide-react, next-themes, @radix-ui/react-avatar, tailwind-merge (+7 more)

### Community 66 - "Components Builder"
Cohesion: 0.18
Nodes (12): autoSeo(), DASHBOARD_MODE_LAYOUTS, daysAgo(), formatDate(), NewProjectWizard(), OG_TYPES, SCHEMA_TYPES, SEO_FIELDS (+4 more)

### Community 67 - "Src Lib"
Cohesion: 0.19
Nodes (9): num(), readBase(), ResponsivePanel(), SLIDER_PROPS, AT_RULES, BREAKPOINTS, buildResponsiveOverridesCss(), TIERS (+1 more)

### Community 68 - "Backend Tests"
Cohesion: 0.20
Nodes (7): demo(), _doc(), Backend parity regression: the 117 author-time-classed library blocks…, Runnable self-check (also exercised by pytest above)., TestBackgroundImageVarWrapping, TestBundlePathShipsStaticBlockCssPerCategory, TestPreviewPathShipsStaticBlockCss

### Community 69 - "Backend Models"
Cohesion: 0.25
Nodes (13): apply_astro_transform(), apply_nextjs_transform(), _body_and_head(), _head_jsx(), _json(), _jsx_attr(), _parse_attrs(), _pkg_name() (+5 more)

### Community 70 - "Backend"
Cohesion: 0.18
Nodes (14): _decrypt(), FulfillmentUpdateRequest, get_publish_preset_secret(), _paypal_api_base(), _paypal_get_access_token(), _paypal_get_order(), paypal_verify(), PaypalVerifyRequest (+6 more)

### Community 71 - "Backend Tests"
Cohesion: 0.26
Nodes (6): _minimal_order(), asyncio, TestPaypalHelpers, TestSendEmail, TestUpsertOrderReturnsWhetherItInserted, patch

### Community 72 - "Backend Tests"
Cohesion: 0.18
Nodes (5): _head(), Phase 5 smoke-test remediation regressions (Issues #2, #3, #7). Pure-function…, TestHeadIsBoilerplate, TestNoInlineStyleAttributes, TestTypedPages

### Community 73 - "Superpowers Plans"
Cohesion: 0.19
Nodes (14): Unreachable New Project Picker Bug, Stale-pages Closure Save Bug, Save As Feature, Asset Path Rewriting Plan, FileTree.jsx, ImportExportModal.jsx, MenuBar.jsx, ProjectTemplatesModal.jsx (+6 more)

### Community 74 - "Src Lib"
Cohesion: 0.23
Nodes (10): Social Buttons Tool, DEFAULT_FOLLOW, DEFAULT_SHARE, SocialShareModal(), buildSocialHtml(), HOVERS, PLATFORMS, SHAPES (+2 more)

### Community 75 - "Src Lib"
Cohesion: 0.27
Nodes (11): childLayersFor(), fxOf(), labelFor(), LayersPanel(), styleVal(), getAnimClip(), subs, subscribeAnimClip() (+3 more)

### Community 76 - "Src Lib"
Cohesion: 0.31
Nodes (13): deleteSnapshot(), enqueue(), flushQueue(), getSnapshot(), listSnapshots(), localDbAvailable, openDb(), pendingEntries() (+5 more)

### Community 77 - "Superpowers Plans"
Cohesion: 0.26
Nodes (13): Analytics tab (revenue chart + funnel), Analytics customer breakdown & top products sections, Analytics customer_breakdown (new vs returning), GET /api/dashboard/{project_id}/analytics: revenue trend & fulfillment funnel, Analytics top_products, Analytics endpoint design (window/trend/funnel/breakdown/products), Analytics non-goals (no date range, no caching), Insights tab (alert cards) (+5 more)

### Community 78 - "Backend Tests"
Cohesion: 0.17
Nodes (6): client(), created_ids(), fixture, TestAnalytics, TestPreview, TestPublishUnreachable

### Community 79 - "Backend Tests"
Cohesion: 0.15
Nodes (3): Regression tests for the custom_js page field: Pydantic default, and injection…, TestCustomJsInjection, TestCustomJsModel

### Community 80 - "Backend Tests"
Cohesion: 0.23
Nodes (8): _decls_of(), _pages_of(), parametrize, Phase 6 Task 5: parser round-trip validation for the starter templates (the…, Removes complete <script>…</script> blocks so the inline-style round-trip…, _tag_counts(), TestStarterTemplateRoundTrip, _without_scripts()

### Community 81 - "Backend Tests"
Cohesion: 0.17
Nodes (7): client(), project(), fixture, Tests for the Timeline and Bento Zenero content types…, Creates a real project (via the API, so motor's event-loop binding is handled…, TestBentoTiles, TestTimelineEntries

### Community 82 - "Docs"
Cohesion: 0.24
Nodes (13): Semantic Block Class Naming Scheme, Canonical HTML Export Page Structure, Phase 4b Author-time Block Refactor (Path A), Phase 4 Block Menu Audit & CSS-Class Map, Web Dojo Phase 4a Handoff, lib/blockClassName.js, lib/fonts.js, lib/jsAutoLink.js (+5 more)

### Community 83 - "Components Builder"
Cohesion: 0.19
Nodes (5): cellHtml(), FlexBuilder(), GridBuilder(), LayoutBuilder(), trackStr()

### Community 84 - "Components Ui"
Cohesion: 0.23
Nodes (10): FormControl, FormDescription, FormFieldContext, FormItem, FormItemContext, FormLabel, FormMessage, useFormField() (+2 more)

### Community 85 - "Superpowers Plans"
Cohesion: 0.21
Nodes (12): CSV export on Orders & Customers tabs, CSV export design, GET /api/dashboard/{project_id}/customers, PATCH .../orders/{id}/fulfillment + shipped/delivered emails, Customer aggregation design, Fulfillment status field & transitions design, Password hashing & dashboard token helpers, Dashboard set-password/unlock endpoints + _require_dashboard_token (+4 more)

### Community 86 - "Backend Models"
Cohesion: 0.24
Nodes (11): FunnelAnalyticsResponse, FunnelEvent, FunnelEventCreate, get_funnel_analytics(), BaseModel, get, post, Funnel tracking data model + analytics endpoint. Tracks visitor progression… (+3 more)

### Community 87 - "Backend Tests"
Cohesion: 0.18
Nodes (3): parametrize, TestCheckoutSessionProjectId, TestOrdersListEndpoint

### Community 88 - "Superpowers Specs"
Cohesion: 0.18
Nodes (12): Rejected SPA-Shell Page-Transition Approach, CSS Cross-Document @view-transition At-Rule, Native CMS Core 2b: Authoring Plan (Retired), Native Page Transitions Design, BindPanel.jsx (proposed, retired), Canvas.jsx, PagesBar.jsx, RightSidebar.jsx (+4 more)

### Community 89 - "Components Ui"
Cohesion: 0.27
Nodes (9): CommandPalette(), Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator (+1 more)

### Community 90 - "Src Hooks"
Cohesion: 0.27
Nodes (11): Toaster(), actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState, reducer() (+3 more)

### Community 91 - "Src Lib"
Cohesion: 0.23
Nodes (7): authedHeaders, authHeaders(), COLORS, heartbeat(), logout(), presenceColor(), startPresenceLoop()

### Community 92 - "Src Lib"
Cohesion: 0.30
Nodes (8): scaffoldProjectFiles(), STARTER_SCRIPT(), STARTER_STYLES(), project, uid(), STANDARD_LAYOUT_CSS, STANDARD_LAYOUT_SECTIONS, project

### Community 93 - "Backend Models"
Cohesion: 0.33
Nodes (11): delete_bento_tile(), delete_blog_post(), delete_fixture(), delete_gallery_item(), delete_org_stat(), delete_portfolio_item(), delete_roster_player(), delete_timeline_entry() (+3 more)

### Community 94 - "Superpowers Plans"
Cohesion: 0.18
Nodes (11): CommerceTab SMTP fields, Confirmation email wired into order creation, _send_email + email templates, POST /api/commerce/smtp-config, _upsert_order returns bool + fulfillment_status field, SMTP & email sending design, Email is opt-in, silently skipped if unconfigured (rationale), CommerceTab PayPal Secret field (+3 more)

### Community 95 - "Src Lib"
Cohesion: 0.38
Nodes (8): CDNPanel(), CDN_COMPONENTS, cdnComponentGroups(), CDN_CATEGORIES, CDN_LIBRARIES, isLibInHead(), marker(), toggleLib()

### Community 96 - "Src Lib"
Cohesion: 0.42
Nodes (8): FormBuilderModal(), buildFormHtml(), DEFAULT_FORM(), FIELD_TYPES, fieldControl(), newField(), themeCss(), uid()

### Community 97 - "Components Builder"
Cohesion: 0.33
Nodes (9): ensureFont(), hexLum(), loadedFonts, MiniThemePreview(), onColor(), ThemeGenerator(), buildCustomThemeHead(), themeHeadHtml() (+1 more)

### Community 98 - "Superpowers Specs"
Cohesion: 0.27
Nodes (10): E-Commerce Phase 3 Implementation Plan (Analytics), Web Dojo E-Commerce Phase 3 Spec (Analytics), aiosqlite, cryptography (Fernet), FastAPI, E-Commerce Phase 2 Implementation Plan (Customers & Email), Web Dojo E-Commerce Phase 2 Spec (Customers & Email), E-Commerce Phase 4 Implementation Plan (Insights) (+2 more)

### Community 99 - "Backend"
Cohesion: 0.24
Nodes (10): expand_collection_tokens(), Replace {%name.field%} / {%name.count%} tokens in exported HTML. `field`…, _ftp_upload(), publish_project(), PublishRequest, Reject filenames that could escape the upload directory: path separators…, Blocking FTP/FTPS upload. Runs in a thread from the async endpoint., Blocking SFTP upload via paramiko. (+2 more)

### Community 100 - "Memory"
Cohesion: 0.20
Nodes (9): Background Music Feature, Stripe + PayPal Commerce Integration, JPY Zero-Decimal Currency Fix, Encrypted Publish Presets, Starter Aesthetic Gallery, Web Dojo WYSIWYG Builder, Emergent Build Environment Config, Frontend index.html (+1 more)

### Community 101 - "Backend"
Cohesion: 0.20
Nodes (10): _build_client(), ensure_indexes(), _ensure_live_client(), provider_ref is the idempotency key for orders. _upsert_order's read-then-write…, Idempotent upsert of curated starter templates on boot., Construct a fresh DB client + database handle for whichever backend is…, Return a usable (client, db), rebuilding the process-global pair when a prior…, seed_starter_templates() (+2 more)

### Community 104 - "Src Lib"
Cohesion: 0.27
Nodes (9): BlogPost, injectBlog(), InjectionPayload, injectOxygenContent(), injectTimeline(), injectUpdates(), TimelineLeaf, TimelineStem (+1 more)

### Community 105 - "Backend Models"
Cohesion: 0.33
Nodes (8): _cutoff_iso(), _now(), presence_ping(), PresencePing, BaseModel, post, Collaboration presence (Phase 9A). The dependency-free slice of the…, _user_id_from()

### Community 106 - "Docs"
Cohesion: 0.31
Nodes (9): starter_templates.py, 27 Aesthetic Mood-Board Templates Multi-Page Expansion, 7 Retro-Nostalgia Templates, Period-Accurate Expansion Only, Retro Template Modernization Methodology, 57 Multi-page Starter Templates, Retro Template Modernization Framework, Starter Templates Full Audit, Phase 2 (Done), Starter Template Documentation (+1 more)

### Community 108 - "Frontend"
Cohesion: 0.22
Nodes (9): browserslist, development, production, >0.2%, last 1 chrome version, last 1 firefox version, last 1 safari version, not dead (+1 more)

### Community 109 - "Src Lib"
Cohesion: 0.36
Nodes (5): defaultStops, GradientMixer(), hexAlphaToRgba(), GRADIENT_PRESET_CATEGORIES, GRADIENT_PRESETS

### Community 110 - "Src Lib"
Cohesion: 0.44
Nodes (7): SeoPanel(), altTextCoverage(), collectExportSeoWarnings(), computeSeoChecks(), scoreColor(), stripTags(), wordCount()

### Community 111 - "Components Ui"
Cohesion: 0.39
Nodes (7): Toast, ToastAction, ToastClose, ToastDescription, ToastTitle, toastVariants, ToastViewport

### Community 112 - "Src Lib"
Cohesion: 0.56
Nodes (7): buildFontFace(), buildFontsStyleBlock(), buildFontsStyleContent(), buildFontVar(), fontFamilyFromFilename(), fontFamilySlug(), getFontFormat()

### Community 113 - "Src Lib"
Cohesion: 0.28
Nodes (7): applyTemplate(), hasProjectContent(), buttonBlock, currentProject, heroBlock, template, textBlock

### Community 114 - "Src Lib"
Cohesion: 0.36
Nodes (6): exportWithGemTheme(), GEM_CSS, GEM_THEMES, getAllGemCss(), getGemCss(), SHARED_ANIMATIONS

### Community 117 - "Docs"
Cohesion: 0.25
Nodes (8): Mobile-First SERP Preview Toggle, SEO Validation-on-Create Feature, Template Versioning Feature, New Dashboard / New Dashboard-Blog Wizard Modes, Web Dojo Phase 2 Handoff Document, NewProjectWizard.jsx, lib/seoFieldChecks.js, lib/seoScore.js

### Community 118 - "Docs"
Cohesion: 0.29
Nodes (8): --wd-* Chrome Token Theming System, 5-step Theme Validation Checklist, Web Dojo Theme Development Guide, Theme Validation Checklist & Coverage Matrix, themes/chrome.js, themes/index.js, themes/skinning.css, themes/themeValidation.js

### Community 119 - "Src Lib"
Cohesion: 0.39
Nodes (4): SvgBackgroundPanel(), SVG_BG_PRESET_CATEGORIES, SVG_BG_PRESETS, args

### Community 120 - "Components Ui"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 121 - "Components Ui"
Cohesion: 0.39
Nodes (7): Carousel, CarouselContent, CarouselContext, CarouselItem, CarouselNext, CarouselPrevious, useCarousel()

### Community 122 - "Components Ui"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 123 - "Components Ui"
Cohesion: 0.29
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 124 - "Components Ui"
Cohesion: 0.29
Nodes (7): SheetContent, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 125 - "Src Lib"
Cohesion: 0.43
Nodes (7): billingEnabled(), envFlag(), featureEnabled(), FLAG_DEFAULTS, isEducational(), lsOverride(), MAX_CLASSROOM_SEATS

### Community 126 - "Superpowers Plans"
Cohesion: 0.29
Nodes (8): Buyer receipt rendering (cart.js), cart.js sends project_id + verifies PayPal, checkout-session project_id/shipping/promo, PayPal REST helpers (_paypal_get_access_token/_paypal_get_order), POST /api/commerce/paypal/verify, POST /api/commerce/webhook (Stripe), orders collection + _upsert_order, Buyer receipt design

### Community 127 - "Src Tauri Capabilities"
Cohesion: 0.25
Nodes (7): core:default, main, description, identifier, permissions, $schema, windows

### Community 128 - "Backend"
Cohesion: 0.29
Nodes (7): httpx, Motor (async MongoDB driver), pytest, Stripe Python SDK, E-Commerce Phase 1 Implementation Plan (Payments & Orders), Global Stripe key / no Stripe Connect (limitation), Stripe checkout + webhook verification flow

### Community 131 - "Backend Tests"
Cohesion: 0.29
Nodes (6): _cleanup_test_sqlite(), fixture, pytest_configure(), # NOTE: the file itself is named per-worker in pytest_configure below —, Runs once per process — including each xdist worker, where config.workerinput…, Remove this worker's SQLite file at the end of the session so repeated test…

### Community 133 - "Frontend"
Cohesion: 0.29
Nodes (6): jest, moduleNameMapper, name, packageManager, private, version

### Community 134 - "Frontend"
Cohesion: 0.29
Nodes (7): scripts, build, build:tauri, start, test, test:visual, test:visual:update

### Community 136 - "Components Ui"
Cohesion: 0.43
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 137 - "Constants Testids"
Cohesion: 0.29
Nodes (4): LOGIN, LOGOUT, REGISTER, HOME

### Community 138 - "Src Lib"
Cohesion: 0.52
Nodes (5): ANALYTICS_FIELDS, buildAnalyticsHead(), buildOne(), safe(), upsertAnalyticsHead()

### Community 139 - "Src Lib"
Cohesion: 0.52
Nodes (5): buildOutlineFromPage(), nodesToOutline(), _STRUCTURAL, _textOf(), _walk()

### Community 146 - "Src Tauri Src"
Cohesion: 0.47
Nodes (5): CommandChild, Mutex, Option, run(), SidecarProcess

### Community 147 - "Frontend"
Cohesion: 0.33
Nodes (5): compilerOptions, baseUrl, paths, include, src

### Community 148 - "Plugins Health Check"
Cohesion: 0.47
Nodes (5): formatBytes(), formatDuration(), os, SERVER_START_TIME, setupHealthEndpoints()

### Community 149 - "Components Builder"
Cohesion: 0.47
Nodes (3): EcommerceDashboardModal(), EcommerceOrdersPanel(), FULFILLMENT_OPTIONS

### Community 150 - "Components Builder"
Cohesion: 0.40
Nodes (3): PagesBar(), STATUS, pages

### Community 151 - "Components Builder"
Cohesion: 0.40
Nodes (5): CORNER_SHAPES, cssStr(), PRESETS, SHADOW_PRESETS, ShapePanel()

### Community 152 - "Src Lib"
Cohesion: 0.73
Nodes (3): VariantPanel(), readVariant(), stampVariant()

### Community 154 - "Frontend"
Cohesion: 0.40
Nodes (3): config, path, webpackConfig

### Community 155 - "Src Lib"
Cohesion: 0.60
Nodes (4): AssetsLibrary(), analyzeAssets(), collectAll(), replaceToken()

### Community 157 - "Backend"
Cohesion: 0.50
Nodes (3): _die_with_parent(), PyInstaller entrypoint for the desktop sidecar build. Runs the same FastAPI app…, On Linux, ask the kernel to SIGTERM this process automatically whenever its…

### Community 158 - "Backend"
Cohesion: 0.50
Nodes (4): My Holiday Photo.JPG' → 'my-holiday-photo.jpg' (filesystem-safe)., _slugify_filename(), upload_asset(), UploadFile

### Community 162 - ".emergent Cron"
Cohesion: 0.83
Nodes (3): read_secret(), dispatch_webhook.sh script, strip_quotes()

### Community 164 - "Superpowers Plans"
Cohesion: 1.00
Nodes (3): _cap_request_body(), _extract_submission(), POST /api/submissions Body-Size Cap

## Knowledge Gaps
- **459 isolated node(s):** `webhook_crond.sh script`, `$schema`, `style`, `rsc`, `tsx` (+454 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1016 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **111 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `/api/submissions Unscoped GET/DELETE Fix` connect `URL Import & SSRF Guards` to `Commerce & Template CRUD`, `Builder Modals & Panels`?**
  _High betweenness centrality (0.332) - this node is a cross-community bridge._
- **Why does `SubmissionsModal()` connect `Builder Modals & Panels` to `URL Import & SSRF Guards`, `Onboarding & Add Page UI`?**
  _High betweenness centrality (0.326) - this node is a cross-community bridge._
- **Why does `list_submissions()` connect `Commerce & Template CRUD` to `Commerce Checkout Backend`, `URL Import & SSRF Guards`, `Backend Models`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Are the 45 inferred relationships involving `_require_dashboard_token()` (e.g. with `create_collection()` and `create_collection_item()`) actually correct?**
  _`_require_dashboard_token()` has 45 INFERRED edges - model-reasoned connections that need verification._
- **What connects `webhook_crond.sh script`, `$schema`, `style` to the rest of the system?**
  _459 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Block Edit Menu` be split into smaller, more focused modules?**
  _Cohesion score 0.06869446343130553 - nodes in this community are weakly interconnected._
- **Should `Backend SQLite Compat Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.05144230769230769 - nodes in this community are weakly interconnected._