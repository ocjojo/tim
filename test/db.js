var jsonServer = require('json-server');

/**
 * add routes as needed
 */
var routes = {
	"application/:id.json": requireFailSilent("./routes/application_id.json"),
	"applications.json": requireFailSilent("./routes/applications.json"),
	"committees/autocomplete.json": requireFailSilent("./routes/committees_autocomplete.json"),
	"committees/:committee_id.json": requireFailSilent("./routes/committees_id.json"),
	"committees/:committee_id/terms.json": requireFailSilent("./routes/committees_id_terms.json"),
	"committees/:committee_id/terms/:term_id.json": requireFailSilent("./routes/committees_id_terms_id.json"),
	"committees/:committee_id/terms/:term_id/invitations.json": requireFailSilent("./routes/committees_id_terms_id_invitations.json"),
	"current_person.json": requireFailSilent("./routes/current_person.json"),
	"current_person/saved_filters.json": requireFailSilent("./routes/current_person_saved_filters.json"),
	"lists/backgrounds.json": requireFailSilent("./routes/lists_backgrounds.json"),
	"lists/industries.json": requireFailSilent("./routes/lists_industries.json"),
	"lists/languages.json": requireFailSilent("./routes/lists_languages.json"),
	"lists/lcs.json": requireFailSilent("./routes/lists_lcs.json"),
	"lists/locations.json": requireFailSilent("./routes/lists_locations.json"),
	"lists/mcs.json": requireFailSilent("./routes/lists_mcs.json"),
	"lists/organisation_sizes.json": requireFailSilent("./routes/lists_organisation_sizes.json"),
	"lists/organisation_types.json": requireFailSilent("./routes/lists_organisation_types.json"),
	"lists/skills.json": requireFailSilent("./routes/lists_skills.json"),
	"opportunities.json": requireFailSilent("./routes/opportunities.json"),
	"opportunities/:id.json": requireFailSilent("./routes/committees_id.json"),
	"opportunities/:opp_id/applications.json": requireFailSilent("./routes/opportunities_id_applications.json"),
	"opportunities/my.json": requireFailSilent("./routes/opportunities_my.json"),
	"organisations.json": requireFailSilent("./routes/organisations.json"),
	"people.json": requireFailSilent("./routes/people.json"),
	"people/:id.json": requireFailSilent("./routes/people_id.json"),
	"people/my.json": requireFailSilent("./routes/people_my.json"),
	"teams/:id/positions.json": requireFailSilent("./routes/teams_id_positions.json"),
	"v1/offices/:office_id/terms/:term_id.json": requireFailSilent("./routes/v1_offices_id_terms_id.json"),
};

/**
 * no need to change below here
 */

function requireFailSilent(modulePath){
	try {
		return require(modulePath);
    }
    catch (e) {
		console.log(`Could not find ${modulePath}`);
		return;
	}
}

var middlewares = jsonServer.defaults();
var router = jsonServer.router(routes);
var server = jsonServer.create();

server.use(middlewares);
server.use(router);

var middlewares = server._router.stack;
middlewares.forEach(removeMiddlewares);
function removeMiddlewares(route, i, routes) {
	//removes the nested router from json-server as it rewrites /:resource/:id/:nested -> /:nested
    if (route.name == 'router')
        route.handle.stack.splice(4, 1);
}


server.listen(3000, function () {
  console.log('JSON Server is running');
});