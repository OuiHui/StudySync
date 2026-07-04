---
trigger: model_decision
description: This rule should be applied when adding/removing features.
---

For every feature, ensure that there are unit tests, integration tests, and e2e tests. For each test, ensure that local data created in the database is also deleted. Upon finishing any feature, ensure that all tests are passing. If a feature is removed/changed, also make sure the tests are removed/changed as well. Make tests concise and ensure that they accurately test intended behavior. If intended behavior is unclear, ask the user.