
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

async function verifierAdmin() {

    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();

    if (userError || !userData.user) {
        window.location.href = "Connexion.html";
        return;
    }

    const user = userData.user;

    const { data: admin, error: adminError } =
        await supabaseClient
            .from("administrateurs")
            .select("id, nom_complet, actif")
            .eq("auth_user_id", user.id)
            .eq("actif", true)
            .maybeSingle();

    if (adminError || !admin) {
        alert("Accès réservé à l'Administrateur.");
        await supabaseClient.auth.signOut();
        window.location.href = "Connexion.html";
        return;
    }

    document.querySelector("main h3").textContent =
        "Bienvenue Admin : " + admin.nom_complet;
}

verifierAdmin();


document.getElementById("btnVoirAgents").addEventListener("click", async function() {

    const zone = document.getElementById("listeAgents");
    zone.textContent = "Chargement des Agents...";

    const { data: agents, error } = await supabaseClient
        .from("agents")
        .select("id, code_agent, nom_complet, telephone, actif")
        .order("nom_complet", { ascending: true });

    if (error) {
        alert("Erreur Agents : " + error.message);
        zone.textContent = "Erreur : " + error.message;
        return;
    }

    if (!agents || agents.length === 0) {
        zone.textContent = "Aucun Agent trouvé.";
        return;
    }

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Code Agent", "Nom complet", "Téléphone", "Statut", "Actions"]
        .forEach(function(titre) {
            const cellule = document.createElement("th");
            cellule.textContent = titre;
            entete.appendChild(cellule);
        });

    agents.forEach(function(agent) {

        const ligne = tableau.insertRow();

        [
            agent.code_agent,
            agent.nom_complet,
            agent.telephone,
            agent.actif ? "Actif" : "Désactivé"
        ].forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur ?? "";
        });

        const celluleActions = ligne.insertCell();

        celluleActions.style.textAlign = "center";
        celluleActions.style.padding = "8px";

        // BOUTON MODIFIER
        const boutonModifier = document.createElement("button");
        boutonModifier.textContent = "Modifier";

        boutonModifier.addEventListener("click", async function() {

            const nouveauCode = prompt("Nouveau Code Agent :", agent.code_agent);
            if (nouveauCode === null) return;

            const nouveauNom = prompt("Nouveau Nom complet :", agent.nom_complet);
            if (nouveauNom === null) return;

            const nouveauTelephone = prompt("Nouveau Téléphone :", agent.telephone || "");
            if (nouveauTelephone === null) return;

            if (!nouveauCode.trim() || !nouveauNom.trim()) {
                alert("Le Code et le Nom sont obligatoires.");
                return;
            }

            const { error } = await supabaseClient
                .from("agents")
                .update({
                    code_agent: nouveauCode.trim(),
                    nom_complet: nouveauNom.trim(),
                    telephone: nouveauTelephone.trim()
                })
                .eq("id", agent.id);

            if (error) {
                alert("Erreur : " + error.message);
                return;
            }

            alert("Agent modifié avec succès.");
            document.getElementById("btnVoirAgents").click();
        });

        // BOUTON ACTIVER / DESACTIVER
        const boutonStatut = document.createElement("button");
        boutonStatut.textContent = agent.actif ? "Désactiver" : "Activer";

        boutonStatut.addEventListener("click", async function() {

            const { error } = await supabaseClient
                .from("agents")
                .update({ actif: !agent.actif })
                .eq("id", agent.id);

            if (error) {
                alert("Erreur : " + error.message);
                return;
            }

            alert("Statut de l'Agent modifié avec succès.");
            document.getElementById("btnVoirAgents").click();
        });

        // BUTTON ZOSE MURI COLONNE ACTIONS
        celluleActions.appendChild(boutonModifier);
        celluleActions.appendChild(boutonStatut);

    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnDeconnexion").addEventListener("click", async function() {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        alert("Erreur de déconnexion : " + error.message);
        return;
    }

    window.location.replace("Connexion.html");
});
document.getElementById("btnMasquerAgents").addEventListener("click", function() {

    document.getElementById("listeAgents").innerHTML = "";

});

document.getElementById("rechercheAgent").addEventListener("input", function() {

    const recherche = this.value.toLowerCase().trim();

    const tableau = document.querySelector("#listeAgents table");

    if (!tableau) return;

    const lignes = tableau.querySelectorAll("tr");

    lignes.forEach(function(ligne, index) {
        if (index === 0) return;

        const nom = ligne.cells[1].textContent.toLowerCase();

        ligne.style.display = nom.includes(recherche) ? "" : "none";
    });
});
document.getElementById("btnAjouterAgent").addEventListener("click", function() {
    document.getElementById("formulaireAgent").style.display = "block";
});
document.getElementById("btnAnnulerAgent").addEventListener("click", function() {
    document.getElementById("formulaireAgent").style.display = "none";
});

document.getElementById("btnEnregistrerAgent").addEventListener("click", async function() {

    const code = document.getElementById("nouveauCodeAgent").value.trim();
    const nom = document.getElementById("nouveauNomAgent").value.trim();
    const telephone = document.getElementById("nouveauTelephoneAgent").value.trim();
    const email = document.getElementById("nouveauEmailAgent").value.trim();
    const password = document.getElementById("nouveauMotDePasseAgent").value;

    if (!code || !nom || !email || !password) {
        alert("Veuillez remplir tous les champs obligatoires.");
        return;
    }

    if (password.length < 8) {
        alert("Le mot de passe doit avoir au moins 8 caractères.");
        return;
    }

    const { data, error } = await supabaseClient.functions.invoke(
        "ajouter-agent",
        {
            body: {
                code_agent: code,
                nom_complet: nom,
                telephone: telephone,
                email: email,
                password: password
            }
        }
    );

    if (error) {
        alert("Erreur : " + error.message);
        return;
    }

    if (data.error) {
        alert("Erreur : " + data.error);
        return;
    }

    alert("Agent créé avec succès !");

    document.getElementById("formulaireAgent").style.display = "none";

    document.getElementById("nouveauCodeAgent").value = "";
    document.getElementById("nouveauNomAgent").value = "";
    document.getElementById("nouveauTelephoneAgent").value = "";
    document.getElementById("nouveauEmailAgent").value = "";
    document.getElementById("nouveauMotDePasseAgent").value = "";

    document.getElementById("btnVoirAgents").click();
});
// ======================================
// GESTION DES CLIENTS - ADMIN
// ======================================

let clientsAdmin = [];
let clientAdminEnModification = null;


// 1. AFFICHER TOUS LES CLIENTS


async function chargerTousLesClients() {

    const zone = document.getElementById("listeTousClients");

    zone.textContent = "Chargement des Clients...";

    const { data: clients, error } = await supabaseClient
        .from("clients")
        .select("*")
        .order("nom_complet", { ascending: true });

    if (error) {
        alert("Erreur Clients : " + error.message);
        zone.textContent = "Erreur : " + error.message;
        return;
    }

    clientsAdmin = clients || [];

    alert("Nombre de Clients trouvés : " + clientsAdmin.length);

    afficherClientsAdmin();
}



// 2. CONSTRUIRE LA LISTE


function afficherClientsAdmin() {

    const zone = document.getElementById("listeTousClients");

    if (!zone) {
        alert("Erreur : listeTousClients introuvable.");
        return;
    }

    zone.style.display = "block";
    zone.style.visibility = "visible";
    zone.replaceChildren();

    const recherche = document
        .getElementById("rechercheClientsAdmin")
        .value.toLowerCase().trim();

    const clientsFiltres = clientsAdmin.filter(function(client) {
        return (
            (client.code_client || "").toLowerCase().includes(recherche) ||
            (client.nom_complet || "").toLowerCase().includes(recherche)
        );
    });

    if (clientsFiltres.length === 0) {
        zone.textContent = "Aucun Client trouvé.";
        return;
    }

    const tableau = document.createElement("table");

    tableau.style.width = "100%";
    tableau.style.borderCollapse = "collapse";

    const entete = tableau.insertRow();

    [
        "Code Client",
        "Nom complet",
        "Téléphone",
        "Adresse",
        "Numéro pièce",
        "Date inscription",
        "Statut",
        "Actions"
    ].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        cellule.style.border = "1px solid black";
        cellule.style.padding = "8px";
        entete.appendChild(cellule);
    });

    clientsFiltres.forEach(function(client) {

        const ligne = tableau.insertRow();

        const valeurs = [
            client.code_client,
            client.nom_complet,
            client.telephone,
            client.adresse,
            client.numero_piece,
            client.date_inscription,
            client.actif ? "Actif" : "Désactivé"
        ];

        valeurs.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur ?? "";
            cellule.style.border = "1px solid black";
            cellule.style.padding = "8px";
        });

        const celluleActions = ligne.insertCell();

        const boutonModifier = document.createElement("button");
        boutonModifier.textContent = "Modifier";
        boutonModifier.onclick = function() {
            ouvrirModificationClient(client);
        };

        const boutonStatut = document.createElement("button");
        boutonStatut.textContent = client.actif ? "Désactiver" : "Activer";
        boutonStatut.onclick = function() {
            changerStatutClient(client);
        };

        celluleActions.style.whiteSpace = "nowrap";

celluleActions.appendChild(boutonModifier);
celluleActions.appendChild(boutonStatut);
    });

    zone.appendChild(tableau);
}



// 3. RECHERCHE

document
    .getElementById("rechercheClientsAdmin")
    .addEventListener("input", afficherClientsAdmin);


// 4. BOUTON VOIR TOUS LES CLIENTS

document
    .getElementById("btnVoirTousClients")
    .addEventListener("click", chargerTousLesClients);


// 5. OUVRIR LE FORMULAIRE MODIFIER

function ouvrirModificationClient(client) {

    clientAdminEnModification = client.id;

    document.getElementById("adminCodeClient").value =
        client.code_client || "";

    document.getElementById("adminNomClient").value =
        client.nom_complet || "";

    document.getElementById("adminTelephoneClient").value =
        client.telephone || "";

    document.getElementById("adminAdresseClient").value =
        client.adresse || "";

    document.getElementById("adminNumeroPieceClient").value =
        client.numero_piece || "";

    document.getElementById("adminDateInscriptionClient").value =
        client.date_inscription || "";

    document.getElementById("formulaireModifierClient").style.display =
        "block";

}


// 6. ENREGISTRER LES MODIFICATIONS

document
    .getElementById("btnSauverModificationClient")
    .addEventListener("click", async function() {

        if (!clientAdminEnModification) {
            alert("Aucun Client sélectionné.");
            return;
        }

        const code = document.getElementById("adminCodeClient").value.trim();
        const nom = document.getElementById("adminNomClient").value.trim();
        const telephone = document.getElementById("adminTelephoneClient").value.trim();
        const adresse = document.getElementById("adminAdresseClient").value.trim();
        const numeroPiece = document.getElementById("adminNumeroPieceClient").value.trim();
        const dateInscription = document.getElementById("adminDateInscriptionClient").value;

        if (!code || !nom || !telephone || !dateInscription) {
            alert("Veuillez remplir les champs obligatoires.");
            return;
        }

        const { error } = await supabaseClient
            .from("clients")
            .update({
                code_client: code,
                nom_complet: nom,
                telephone: telephone,
                adresse: adresse,
                numero_piece: numeroPiece,
                date_inscription: dateInscription
            })
            .eq("id", clientAdminEnModification);

        if (error) {
            alert("Erreur : " + error.message);
            return;
        }

        alert("Client modifié avec succès !");

        fermerFormulaireModification();

        await chargerTousLesClients();

    });


// 7. ACTIVER / DESACTIVER UN CLIENT

async function changerStatutClient(client) {

    const nouveauStatut = !client.actif;

    const confirmation = confirm(
        nouveauStatut
            ? "Voulez-vous activer ce Client ?"
            : "Voulez-vous désactiver ce Client ?"
    );

    if (!confirmation) {
        return;
    }

    const { error } = await supabaseClient
        .from("clients")
        .update({
            actif: nouveauStatut
        })
        .eq("id", client.id);

    if (error) {
        alert("Erreur : " + error.message);
        return;
    }

    alert(
        nouveauStatut
            ? "Client activé avec succès !"
            : "Client désactivé avec succès !"
    );

    await chargerTousLesClients();

}


// 8. FERMER LE FORMULAIRE

function fermerFormulaireModification() {

    document.getElementById("formulaireModifierClient").style.display =
        "none";

    document.getElementById("adminCodeClient").value = "";
    document.getElementById("adminNomClient").value = "";
    document.getElementById("adminTelephoneClient").value = "";
    document.getElementById("adminAdresseClient").value = "";
    document.getElementById("adminNumeroPieceClient").value = "";
    document.getElementById("adminDateInscriptionClient").value = "";

    clientAdminEnModification = null;

}


document
    .getElementById("btnAnnulerModificationClient")
    .addEventListener("click", fermerFormulaireModification);
	// FERMER LA LISTE DES CLIENTS

document
    .getElementById("btnFermerListeClients")
    .addEventListener("click", function() {

        document.getElementById("listeTousClients").style.display = "none";

    });
	// ======================================

// ======================================
// HISTORIQUE - ADMIN
// ======================================

let historiqueAdmin = [];

// 1. KURONDERA HISTORIQUE YOSE

async function chargerHistoriqueAdmin() {

    const zone = document.getElementById("listeHistoriqueAdmin");

    zone.style.display = "block";
    zone.textContent = "Chargement de l'historique...";

    const { data, error } = await supabaseClient
        .from("historique")
        .select(`
            id,
            agent_id,
            admin_id,
            module,
            action,
            details,
            date_action,
            agents(nom_complet),
            administrateurs(nom_complet)
        `)
        .order("date_action", { ascending: false });

    if (error) {
        zone.textContent = "Erreur : " + error.message;
        return;
    }

    historiqueAdmin = data || [];

    afficherHistoriqueAdmin();
}

// 2. KUGARAGAZA HISTORIQUE

function afficherHistoriqueAdmin() {

    const zone = document.getElementById("listeHistoriqueAdmin");

    const rechercheNom = document
        .getElementById("rechercheNomHistorique")
        .value.toLowerCase().trim();

    const rechercheDate = document
        .getElementById("rechercheDateHistorique")
        .value;

    const rechercheAction = document
        .getElementById("rechercheActionHistorique")
        .value.toLowerCase().trim();

    zone.replaceChildren();

    const filtres = historiqueAdmin.filter(function(item) {

        const nom = item.agents?.nom_complet ||
                    item.administrateurs?.nom_complet || "";

        const texteAction =
            (item.module || "") + " " + (item.action || "");

        const date = item.date_action
            ? item.date_action.substring(0, 10)
            : "";

        return (
            nom.toLowerCase().includes(rechercheNom) &&
            (!rechercheDate || date === rechercheDate) &&
            texteAction.toLowerCase().includes(rechercheAction)
        );
    });

    if (filtres.length === 0) {
        zone.textContent = "Aucun historique trouvé.";
        return;
    }

    const tableau = document.createElement("table");

    const entete = tableau.insertRow();

    [
        "Nom",
        "Module",
        "Action",
        "Détails",
        "Date"
    ].forEach(function(titre) {

        const th = document.createElement("th");
        th.textContent = titre;
        entete.appendChild(th);

    });

    filtres.forEach(function(item) {

        const ligne = tableau.insertRow();

        const nom = item.agents?.nom_complet ||
                    item.administrateurs?.nom_complet ||
                    "Admin";

        const details = typeof item.details === "object" && item.details !== null
            ? JSON.stringify(item.details)
            : item.details || "";

        const valeurs = [
            nom,
            item.module,
            item.action,
            details,
            item.date_action
                ? new Date(item.date_action).toLocaleString()
                : ""
        ];

        valeurs.forEach(function(valeur) {

            const cellule = ligne.insertCell();
            cellule.textContent = valeur || "";

        });

    });

  zone.appendChild(tableau);
}

// 3. BOUTON VOIR HISTORIQUE

document
    .getElementById("btnVoirHistoriqueAdmin")
    .addEventListener("click", chargerHistoriqueAdmin);

// 4. RECHERCHE

document
    .getElementById("rechercheNomHistorique")
    .addEventListener("input", afficherHistoriqueAdmin);

document
    .getElementById("rechercheDateHistorique")
    .addEventListener("change", afficherHistoriqueAdmin);

document
    .getElementById("rechercheActionHistorique")
    .addEventListener("input", afficherHistoriqueAdmin);

// 5. FERMER LA LISTE

document
    .getElementById("btnFermerHistoriqueAdmin")
    .addEventListener("click", function() {

        document.getElementById("listeHistoriqueAdmin").style.display = "none";

    });


// MODIFIER LES ECHEANCES FUTURES POUR TOUS LES AGENTS

document
    .getElementById("btnModifierEcheancesGlobales")
    .addEventListener("click", async function() {

        const jourEcheance = Number(
            document.getElementById("nouveauJourEcheance").value
        );

        const message = document.getElementById("messageEcheancesAdmin");

        if (!Number.isInteger(jourEcheance) || jourEcheance < 1 || jourEcheance > 31) {
            message.textContent = "Veuillez choisir un jour entre 1 et 31.";
            return;
        }

        const codeSecurite = prompt(
            "Veuillez entrer votre Code de sécurité :"
        );

        if (codeSecurite === null || codeSecurite.trim() === "") {
            message.textContent = "Opération annulée.";
            return;
        }

        const confirmation = confirm(
            "Confirmer le changement du jour de remboursement au " +
            jourEcheance +
            " de chaque mois ? Les échéances déjà en retard resteront inchangées."
        );

        if (!confirmation) {
            message.textContent = "Opération annulée.";
            return;
        }

        message.textContent = "Modification en cours...";

        const { data, error } = await supabaseClient.functions.invoke(
            "modifier-echeances",
            {
                body: {
                    jourEcheance: jourEcheance,
                    codeSecurite: codeSecurite.trim()
                }
            }
        );

        if (error) {
            message.textContent = "Erreur : " + error.message;
            return;
        }

        if (data.erreur) {
            message.textContent = data.erreur;
            return;
        }

        message.textContent =
            data.nombre + " échéance(s) modifiée(s) avec succès !";
    });
// ==================================
// NAVIGATION ENTRE LES MODULES ADMIN
// ==================================

const boutonsNavigationAdmin =
    document.querySelectorAll(".menu-admin button");

const sectionsAdmin = [
    "sectionAgents",
    "sectionClientsAdmin",
    "sectionEpargnesAdmin",
    "sectionCreditsAdmin",
    "sectionRemboursementsAdmin",
    "sectionCaisseAdmin",
    "sectionHistoriqueAdmin",
    "sectionEcheancesAdmin",
    "sectionRapportsAdmin" ,
    "sectionQuestionsVisiteurs"
];

// Cacher toutes les sections au démarrage
sectionsAdmin.forEach(function(id) {
    document.getElementById(id).style.display = "none";
});

// Navigation entre les modules
boutonsNavigationAdmin.forEach(function(bouton) {

    bouton.addEventListener("click", function() {

        const sectionChoisie = bouton.dataset.section;

        sectionsAdmin.forEach(function(id) {
            document.getElementById(id).style.display = "none";
        });

        document.getElementById(sectionChoisie).style.display = "block";

        boutonsNavigationAdmin.forEach(function(b) {
            b.classList.remove("actif");
        });

        bouton.classList.add("actif");

    });

});

document.getElementById("btnVoirToutesEpargnes")
.addEventListener("click", async function() {

    const zone = document.getElementById("listeToutesEpargnes");

    zone.textContent = "Chargement des Épargnes...";

    const { data: epargnes, error } = await supabaseClient
        .from("epargnes")
        .select("*")
        .order("date_operation", { ascending: false });

    if (error) {
        zone.textContent = "Erreur : " + error.message;
        return;
    }

    if (!epargnes || epargnes.length === 0) {
        zone.textContent = "Aucune Épargne trouvée.";
        return;
    }

    const { data: agents } = await supabaseClient
        .from("agents")
        .select("id, nom_complet");

    const { data: clients } = await supabaseClient
        .from("clients")
        .select("id, nom_complet");

    const tableau = document.createElement("table");

    const entete = tableau.insertRow();

    [
        "Date",
        "Agent",
        "Client",
        "Type d'opération",
        "Montant (BIF)",
        "Observation"
    ].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    epargnes.forEach(function(epargne) {

        const agent = (agents || []).find(a => a.id === epargne.agent_id);
        const client = (clients || []).find(c => c.id === epargne.client_id);

        const ligne = tableau.insertRow();

        [
            epargne.date_operation,
            agent ? agent.nom_complet : "",
            client ? client.nom_complet : "",
            epargne.type_operation,
            Number(epargne.montant).toLocaleString("fr-FR"),
            epargne.observation || ""
        ].forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur ?? "";
        });

    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnFermerEpargnesAdmin")
.addEventListener("click", function() {
    document.getElementById("listeToutesEpargnes").innerHTML = "";
});

document.getElementById("btnVoirTousCredits")
.addEventListener("click", async function() {

    const zone = document.getElementById("listeTousCredits");

    zone.textContent = "Chargement des Crédits...";

    const { data: credits, error } = await supabaseClient
        .from("credits")
        .select("*")
        .order("date_credit", { ascending: false });

    if (error) {
        zone.textContent = "Erreur : " + error.message;
        return;
    }

    if (!credits || credits.length === 0) {
        zone.textContent = "Aucun Crédit trouvé.";
        return;
    }

    const { data: agents } = await supabaseClient
        .from("agents")
        .select("id, nom_complet");

    const { data: clients } = await supabaseClient
        .from("clients")
        .select("id, nom_complet");

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    [
    "Date",
    "Agent",
    "Client",
    "Montant Crédit (BIF)",
    "Montant Total (BIF)",
    "Date Échéance",
    "Statut",
    "Actions"

    ].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    credits.forEach(function(credit) {

        const agent = (agents || []).find(a => a.id === credit.agent_id);
        const client = (clients || []).find(c => c.id === credit.client_id);

        const ligne = tableau.insertRow();

         [
            credit.date_credit,
            agent ? agent.nom_complet : "",
            client ? client.nom_complet : "",
            Number(credit.montant_credit).toLocaleString("fr-FR"),
            Number(credit.montant_total).toLocaleString("fr-FR"),
            credit.date_echeance || "",
            credit.statut || ""
        ].forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur ?? "";
        });
       const celluleActions = ligne.insertCell();

const btnModifier = document.createElement("button");
btnModifier.textContent = "Demander modification";

btnModifier.addEventListener("click", async function() {

    const raison = prompt("Pourquoi voulez-vous modifier ce crédit ?");

    if (raison === null || raison.trim() === "") {
        alert("Veuillez préciser la raison.");
        return;
    }

    const { data: utilisateur } = await supabaseClient.auth.getUser();

    if (!utilisateur.user) {
        alert("Administrateur non connecté.");
        return;
    }

    const { error } = await supabaseClient
        .from("demandes_modification")
        .insert({
            agent_id: credit.agent_id,
            admin_auth_id: utilisateur.user.id,
            type_operation: "CREDIT",
            operation_id: credit.id,
            action_demandee: "MODIFIER",
            details_demande: { raison: raison }
        });

    if (error) {
        alert("Erreur : " + error.message);
    } else {
        alert("Demande envoyée à l'Agent.");
    }

});


const btnAnnuler = document.createElement("button");
btnAnnuler.textContent = "Demander annulation";

btnAnnuler.addEventListener("click", async function() {

    const raison = prompt("Pourquoi voulez-vous annuler ce crédit ?");

    if (raison === null || raison.trim() === "") {
        alert("Veuillez préciser la raison.");
        return;
    }

    const { data: utilisateur } = await supabaseClient.auth.getUser();

    if (!utilisateur.user) {
        alert("Administrateur non connecté.");
        return;
    }

    const { error } = await supabaseClient
        .from("demandes_modification")
        .insert({
            agent_id: credit.agent_id,
            admin_auth_id: utilisateur.user.id,
            type_operation: "CREDIT",
            operation_id: credit.id,
            action_demandee: "ANNULER",
            details_demande: { raison: raison }
        });

    if (error) {
        alert("Erreur : " + error.message);
    } else {
        alert("Demande d'annulation envoyée à l'Agent.");
    }

});


celluleActions.appendChild(btnModifier);
celluleActions.appendChild(btnAnnuler);

    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnFermerCreditsAdmin")
.addEventListener("click", function() {
    document.getElementById("listeTousCredits").innerHTML = "";
});

document.getElementById("btnVoirTousRemboursements")
.addEventListener("click", async function() {

    const zone = document.getElementById("listeTousRemboursements");

    zone.textContent = "Chargement des Remboursements...";

    const { data: remboursements, error } = await supabaseClient
        .from("remboursements")
        .select("*")
        .order("date_remboursement", { ascending: false });

    if (error) {
        zone.textContent = "Erreur : " + error.message;
        return;
    }

    if (!remboursements || remboursements.length === 0) {
        zone.textContent = "Aucun Remboursement trouvé.";
        return;
    }

    const { data: agents } = await supabaseClient
        .from("agents")
        .select("id, nom_complet");

    const { data: clients } = await supabaseClient
        .from("clients")
        .select("id, nom_complet");

    const { data: credits } = await supabaseClient
        .from("credits")
        .select("id, montant_credit");

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    [
        "Date",
        "Agent",
        "Client",
        "Montant Crédit (BIF)",
        "Montant Remboursé (BIF)",
        "Amende Payée",
        "Intérêt Payé",
        "Capital Payé"
    ].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    remboursements.forEach(function(remboursement) {

        const agent = (agents || []).find(a => a.id === remboursement.agent_id);
        const client = (clients || []).find(c => c.id === remboursement.client_id);
        const credit = (credits || []).find(c => c.id === remboursement.credit_id);

        const ligne = tableau.insertRow();

        [
            remboursement.date_remboursement,
            agent ? agent.nom_complet : "",
            client ? client.nom_complet : "",
            credit ? Number(credit.montant_credit).toLocaleString("fr-FR") : "",
            Number(remboursement.montant_rembourse).toLocaleString("fr-FR"),
            Number(remboursement.amende_payee || 0).toLocaleString("fr-FR"),
            Number(remboursement.interet_paye || 0).toLocaleString("fr-FR"),
            Number(remboursement.capital_paye || 0).toLocaleString("fr-FR")
        ].forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur ?? "";
        });

    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnFermerRemboursementsAdmin")
.addEventListener("click", function() {
    document.getElementById("listeTousRemboursements").innerHTML = "";
});

document.getElementById("btnVoirCaisseAdmin")
.addEventListener("click", async function() {

    const zone = document.getElementById("listeCaisseAdmin");

    zone.textContent = "Chargement des opérations de caisse...";

    const { data: operations, error } = await supabaseClient
        .from("caisse_operations")
        .select("*")
        .order("date_operation", { ascending: false });

    if (error) {
        zone.textContent = "Erreur : " + error.message;
        return;
    }

    if (!operations || operations.length === 0) {
        zone.textContent = "Aucune opération de caisse trouvée.";
        document.getElementById("soldeGeneralAdmin").textContent = "0 BIF";
        return;
    }

    const { data: agents } = await supabaseClient
        .from("agents")
        .select("id, nom_complet");

    let totalEntrees = 0;
    let totalSorties = 0;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    [
        "Date",
        "Agent",
        "Type",
        "Source",
        "Montant (BIF)",
        "Observation"
    ].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    operations.forEach(function(operation) {

        const agent = (agents || []).find(a => a.id === operation.agent_id);
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        } else if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }

        const ligne = tableau.insertRow();

        [
            operation.date_operation,
            agent ? agent.nom_complet : "",
            operation.type_operation,
            operation.source_type,
            montant.toLocaleString("fr-FR"),
            operation.observation || ""
        ].forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur ?? "";
        });

    });

    const solde = totalEntrees - totalSorties;

    document.getElementById("soldeGeneralAdmin").textContent =
        solde.toLocaleString("fr-FR") + " BIF";

    const resume = document.createElement("p");
    resume.textContent =
        "Total Entrées : " + totalEntrees.toLocaleString("fr-FR") +
        " BIF | Total Sorties : " + totalSorties.toLocaleString("fr-FR") +
        " BIF";

    zone.replaceChildren(resume, tableau);

});

document.getElementById("btnFermerCaisseAdmin")
.addEventListener("click", function() {
    document.getElementById("listeCaisseAdmin").innerHTML = "";
});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnChargerRapports")
.addEventListener("click", async function() {

    const zone = document.getElementById("resultatsRapportsAdmin");

    zone.textContent = "Chargement des Rapports...";

    const [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ] = await Promise.all([

        supabaseClient.from("agents").select("id"),
        supabaseClient.from("clients").select("id"),
        supabaseClient.from("epargnes").select("type_operation, montant"),
        supabaseClient.from("credits").select("montant_credit"),
        supabaseClient.from("remboursements").select("montant_rembourse"),
        supabaseClient.from("caisse_operations").select("type_operation, montant")

    ]);

    const resultats = [
        resultatAgents,
        resultatClients,
        resultatEpargnes,
        resultatCredits,
        resultatRemboursements,
        resultatCaisse
    ];

    const erreur = resultats.find(r => r.error);

    if (erreur) {
        zone.textContent = "Erreur : " + erreur.error.message;
        return;
    }

    const agents = resultatAgents.data || [];
    const clients = resultatClients.data || [];
    const epargnes = resultatEpargnes.data || [];
    const credits = resultatCredits.data || [];
    const remboursements = resultatRemboursements.data || [];
    const caisse = resultatCaisse.data || [];

    let totalDepots = 0;
    let totalRetraits = 0;
    let totalCredits = 0;
    let totalRemboursements = 0;
    let totalEntrees = 0;
    let totalSorties = 0;

    epargnes.forEach(function(e) {
        if (e.type_operation === "DEPOT") {
            totalDepots += Number(e.montant) || 0;
        }

        if (e.type_operation === "RETRAIT") {
            totalRetraits += Number(e.montant) || 0;
        }
    });

    credits.forEach(function(c) {
        totalCredits += Number(c.montant_credit) || 0;
    });

    remboursements.forEach(function(r) {
        totalRemboursements += Number(r.montant_rembourse) || 0;
    });

    caisse.forEach(function(operation) {
        const montant = Number(operation.montant) || 0;

        if (operation.type_operation === "ENTREE") {
            totalEntrees += montant;
        }

        if (operation.type_operation === "SORTIE") {
            totalSorties += montant;
        }
    });

    const soldeCaisse = totalEntrees - totalSorties;

    const tableau = document.createElement("table");
    const entete = tableau.insertRow();

    ["Indicateur", "Résultat"].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    const lignes = [
        ["Nombre total d'Agents", agents.length],
        ["Nombre total de Clients", clients.length],
        ["Total des Dépôts (BIF)", totalDepots.toLocaleString("fr-FR")],
        ["Total des Retraits (BIF)", totalRetraits.toLocaleString("fr-FR")],
        ["Total des Crédits (BIF)", totalCredits.toLocaleString("fr-FR")],
        ["Total des Remboursements (BIF)", totalRemboursements.toLocaleString("fr-FR")],
        ["Total Entrées Caisse (BIF)", totalEntrees.toLocaleString("fr-FR")],
        ["Total Sorties Caisse (BIF)", totalSorties.toLocaleString("fr-FR")],
        ["Solde Général Caisse (BIF)", soldeCaisse.toLocaleString("fr-FR")]
    ];

    lignes.forEach(function(element) {
        const ligne = tableau.insertRow();

        element.forEach(function(valeur) {
            const cellule = ligne.insertCell();
            cellule.textContent = valeur;
        });
    });

    zone.replaceChildren(tableau);

});

document.getElementById("btnVoirReponsesDemandes")
.addEventListener("click", async function() {

    const zone = document.getElementById("listeReponsesDemandes");

    zone.textContent = "Chargement des réponses...";

    const { data: demandes, error } = await supabaseClient
        .from("demandes_modification")
        .select("*")
        .in("statut", ["ACCEPTEE", "REFUSEE", "EXECUTEE"])
        .order("date_reponse", { ascending: false });

    if (error) {
        zone.textContent = "Erreur : " + error.message;
        return;
    }

    if (!demandes || demandes.length === 0) {
        zone.textContent = "Aucune réponse des Agents pour le moment.";
        return;
    }

    const { data: agents } = await supabaseClient
        .from("agents")
        .select("id, nom_complet");

    const tableau = document.createElement("table");

    const entete = tableau.insertRow();

    [
        "Agent",
        "Opération",
        "Action demandée",
        "Réponse",
        "Explication de l'Agent",
"Date réponse",
"Actions"
    ].forEach(function(titre) {
        const cellule = document.createElement("th");
        cellule.textContent = titre;
        entete.appendChild(cellule);
    });

    
demandes.forEach(function(demande) {

    const agent = (agents || []).find(
        a => a.id === demande.agent_id
    );

    const ligne = tableau.insertRow();

    [
        agent ? agent.nom_complet : "",
        demande.type_operation,
        demande.action_demandee,
        demande.statut,
        demande.reponse_agent || "Aucune explication",
        demande.date_reponse
            ? new Date(demande.date_reponse).toLocaleString("fr-FR")
            : ""
    ].forEach(function(valeur) {
        const cellule = ligne.insertCell();
        cellule.textContent = valeur ?? "";
    });

    const celluleActions = ligne.insertCell();

    // MODIFIER LA DURÉE DU CRÉDIT
    if (
        demande.type_operation === "CREDIT" &&
        demande.action_demandee === "MODIFIER" &&
        demande.statut === "ACCEPTEE"
    ) {

        const btnModifier = document.createElement("button");
        btnModifier.textContent = "Modifier la durée";

        btnModifier.addEventListener("click", async function() {

            const nouvelleDuree = prompt(
                "Entrez la nouvelle durée du crédit en mois :"
            );

            if (nouvelleDuree === null) return;

            const duree = Number(nouvelleDuree);

            if (
                !Number.isInteger(duree) ||
                duree <= 0
            ) {
                alert("Veuillez entrer une durée valide.");
                return;
            }

            const confirmation = confirm(
                "Confirmez-vous la nouvelle durée de " +
                duree + " mois ?"
            );

            if (!confirmation) return;

            const { data, error } = await supabaseClient.rpc(
                "modifier_duree_credit_approuvee",
                {
                    p_demande_id: demande.id,
                    p_nouvelle_duree: duree
                }
            );

            if (error) {
    alert(
        "Erreur : " + error.message +
        "\nCode : " + error.code +
        "\nDétails : " + error.details +
        "\nIndice : " + error.hint
    );
    return;
}

            alert(data || "Durée du crédit modifiée avec succès.");

            document.getElementById(
                "btnVoirReponsesDemandes"
            ).click();

            document.getElementById(
                "btnVoirTousCredits"
            ).click();

        });

        celluleActions.appendChild(btnModifier);
    }

    // SUPPRIMER LE CRÉDIT
    if (
        demande.type_operation === "CREDIT" &&
        demande.action_demandee === "ANNULER" &&
        demande.statut === "ACCEPTEE"
    ) {

        const btnSupprimer = document.createElement("button");
        btnSupprimer.textContent = "Supprimer le Crédit";

        btnSupprimer.addEventListener("click", async function() {

            const confirmation = confirm(
                "Voulez-vous vraiment supprimer définitivement ce crédit ?"
            );

            if (!confirmation) return;

            const { data, error } = await supabaseClient.rpc(
                "supprimer_credit_approuve",
                {
                    p_demande_id: demande.id
                }
            );

            if (error) {
                alert("Erreur : " + error.message);
                return;
            }

            alert(data || "Crédit supprimé et historique enregistré.");

            document.getElementById(
                "btnVoirReponsesDemandes"
            ).click();

            document.getElementById(
                "btnVoirTousCredits"
            ).click();

        });

        celluleActions.appendChild(btnSupprimer);
    }

});

    zone.replaceChildren(tableau);

});

// ======================================
// QUESTIONS ENVOYEES PAR LES VISITEURS
// ADMIN SEULEMENT
// ======================================

document
    .getElementById("btnVoirQuestionsVisiteurs")
    .addEventListener("click", async function() {

        const zone = document.getElementById("listeQuestionsVisiteurs");

        zone.textContent = "Chargement des questions...";

        const { data: questions, error } = await supabaseClient
            .from("demandes_questions")
            .select("nom_complet, telephone, province, commune, colline, question, date_creation")
            .order("date_creation", { ascending: false });

        if (error) {
            zone.textContent = "Erreur : " + error.message;
            return;
        }

        if (!questions || questions.length === 0) {
            zone.textContent = "Aucune question reçue.";
            return;
        }

        const tableau = document.createElement("table");
        tableau.style.width = "100%";
        tableau.style.borderCollapse = "collapse";

        const entete = tableau.insertRow();

        [
            "Nom complet",
            "Téléphone",
            "Province",
            "Commune",
            "Colline",
            "Question",
            "Date"
        ].forEach(function(titre) {
            const th = document.createElement("th");
            th.textContent = titre;
            entete.appendChild(th);
        });

        questions.forEach(function(item) {

            const ligne = tableau.insertRow();

            [
                item.nom_complet,
                item.telephone,
                item.province,
                item.commune,
                item.colline,
                item.question,
                item.date_creation
                    ? new Date(item.date_creation).toLocaleString()
                    : ""
            ].forEach(function(valeur) {

                const cellule = ligne.insertCell();
                cellule.textContent = valeur || "";

            });

        });

        zone.replaceChildren(tableau);
    });
