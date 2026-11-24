
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

// ======================================
// QUESTIONS PUBLIQUES - ITEKA KURI TWESE
// ======================================

const btnAfficherQuestions = document.getElementById("btnAfficherQuestions");
const zoneQuestions = document.getElementById("zoneQuestions");
const listeQuestions = document.getElementById("listeQuestions");
const reponseFAQ = document.getElementById("reponseFAQ");
const formQuestionPublique = document.getElementById("formQuestionPublique");

if (btnAfficherQuestions) {
    btnAfficherQuestions.addEventListener("click", async function() {

        zoneQuestions.style.display =
            zoneQuestions.style.display === "none" ? "block" : "none";

        if (zoneQuestions.style.display === "block") {
            listeQuestions.textContent = "Chargement des questions...";

            const { data, error } = await supabaseClient
                .from("questions_frequentes")
                .select("question, reponse")
                .eq("actif", true)
                .order("question");

            if (error) {
                listeQuestions.textContent =
                    "Erreur : " + error.message;
                return;
            }

            listeQuestions.innerHTML = "";

            data.forEach(function(item) {
                const bouton = document.createElement("button");
                bouton.type = "button";
                bouton.textContent = item.question;

                bouton.addEventListener("click", function() {
                    reponseFAQ.textContent = item.reponse;
                });

                listeQuestions.appendChild(bouton);
            });
        }
    });
}

if (formQuestionPublique) {
    formQuestionPublique.addEventListener("submit", async function(event) {
        event.preventDefault();

        const nom = document.getElementById("nomQuestion").value.trim();
        const telephone = document.getElementById("telephoneQuestion").value.trim();
        const province = document.getElementById("provinceQuestion").value.trim();
        const commune = document.getElementById("communeQuestion").value.trim();
        const colline = document.getElementById("collineQuestion").value.trim();
        const question = document.getElementById("texteQuestion").value.trim();

        if (question.length > 20) {
            alert("La question ne doit pas dépasser 20 caractères.");
            return;
        }

        const { error } = await supabaseClient
            .from("demandes_questions")
            .insert([{
                nom_complet: nom,
                telephone: telephone,
                province: province,
                commune: commune,
                colline: colline,
                question: question
            }]);

        if (error) {
            document.getElementById("messageQuestion").textContent =
                "Erreur : " + error.message;
            return;
        }

        document.getElementById("messageQuestion").textContent =
            "Votre question a été envoyée à l'Admin avec succès.";

        formQuestionPublique.reset();
    });
}
