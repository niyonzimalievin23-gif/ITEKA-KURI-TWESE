
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

const loginForm = document.getElementById("loginForm");
const identificationForm = document.getElementById("identificationForm");

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Erreur de connexion : " + error.message);
        return;
    }

    loginForm.style.display = "none";
    identificationForm.style.display = "block";
});
identificationForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const code = document.getElementById("codeUtilisateur").value.trim();
    const nom = document.getElementById("nomComplet").value.trim();

    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData.user;
    if (!user) {
        alert("Veuillez vous reconnecter.");
        return;
    }

    const { data: admin, error: adminError } = await supabaseClient
        .from("administrateurs")
        .select("id, code_admin, nom_complet, actif")
        .eq("auth_user_id", user.id)
        .eq("code_admin", code)
        .eq("nom_complet", nom)
        .eq("actif", true)
        .maybeSingle();

    if (adminError) {
        alert("Erreur : " + adminError.message);
        return;
    }

if (admin) {

    const { error: historiqueError } = await supabaseClient
        .from("historique")
        .insert([{
            admin_id: admin.id,
            agent_id: null,
            module: "Connexion",
            action: "Connexion Admin",
            details: {
                nom: admin.nom_complet
            }
        }]);

    if (historiqueError) {
        alert("Erreur historique : " + historiqueError.message);
        return;
    }

    alert("BIENVENUE ADMIN !\n\n" + admin.nom_complet);
    window.location.href = "tableau-admin.html";
    return;
}

   const { data: agent, error: agentError } = await supabaseClient
    .from("agents")
    .select("id, code_agent, nom_complet, actif")
    .eq("auth_user_id", user.id)
    .maybeSingle();

if (agentError) {
    alert("Erreur Agent : " + JSON.stringify(agentError));
    return;
}


if (!agent) {
    alert("Aucun profil Agent associé à ce compte.");
    return;
}

if (!agent.actif) {
    alert("Votre compte Agent est désactivé.");
    return;
}

if (
    agent.code_agent.trim() === code &&
    agent.nom_complet.trim().toLowerCase() === nom.toLowerCase()
) {

    const { error: historiqueError } = await supabaseClient
        .from("historique")
        .insert([{
            agent_id: agent.id,
            admin_id: null,
            module: "Connexion",
            action: "Connexion Agent",
            details: {
                nom: agent.nom_complet
            }
        }]);

    if (historiqueError) {
        alert("Erreur historique : " + historiqueError.message);
        return;
    }

    alert("BIENVENUE AGENT !\n\n" + agent.nom_complet);
    window.location.href = "tableau-agent.html";
    return;
}

alert("Code ou nom incorrect."); 
});