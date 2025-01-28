import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { ClassicRoutesService } from "@core/services/classic-routes.service";
import { Observable } from "rxjs";
import {
  WikipediaApiService,
  WikipediaPageSummaryInterface
} from "@core/services/api/wikipedia/wikipedia-api.service";

export interface ConstellationInterface {
  id: string;
  name: string;
  data$: Observable<WikipediaPageSummaryInterface>;
}

@Injectable({
  providedIn: "root"
})
export class ConstellationsService {
  private _availableLanguages = ["de", "en", "fr", "it", "es"];
  private _constellations;

  constructor(
    public readonly translateService: TranslateService,
    public readonly classicRoutesService: ClassicRoutesService,
    public readonly wikipediaApiService: WikipediaApiService
  ) {
  }

  getConstellations(language: string): ConstellationInterface[] {
    this._buildConstellationData(language);
    return this._constellations[language] ? this._constellations[language] : this._constellations["en"];
  }

  private _buildConstellationData(language: string) {
    this._constellations = {
      de: [
        ["And", "Andromeda", { requiresDisambiguation: true }],
        ["Ant", "Luftpumpe", { requiresDisambiguation: true }],
        ["Aps", "Paradiesvogel", { requiresDisambiguation: true }],
        ["Aql", "Adler", { requiresDisambiguation: true }],
        ["Aqr", "Wassermann", { requiresDisambiguation: true }],
        ["Ara", "Altar", { requiresDisambiguation: true }],
        ["Ari", "Widder", { requiresDisambiguation: true }],
        ["Aur", "Fuhrmann", { requiresDisambiguation: true }],
        ["Boo", "Bärenhüter"],
        ["CMa", "Großer Hund\n"],
        ["CMi", "Kleiner Hund\n"],
        ["CVn", "Jagdhunde", { requiresDisambiguation: true }],
        ["Cae", "Grabstichel", { requiresDisambiguation: true }],
        ["Cam", "Giraffe", { requiresDisambiguation: true }],
        ["Cap", "Steinbock", { requiresDisambiguation: true }],
        ["Car", "Kiel des Schiffs"],
        ["Cas", "Kassiopeia", { requiresDisambiguation: true }],
        ["Cen", "Zentaur", { requiresDisambiguation: true }],
        ["Cep", "Kepheus", { requiresDisambiguation: true }],
        ["Cet", "Walfisch", { requiresDisambiguation: true }],
        ["Cha", "Chamäleon", { requiresDisambiguation: true }],
        ["Cir", "Zirkel", { requiresDisambiguation: true }],
        ["Cnc", "Krebs", { requiresDisambiguation: true }],
        ["Col", "Taube", { requiresDisambiguation: true }],
        ["Com", "Haar der Berenike"],
        ["CrA", "Südliche Krone"],
        ["CrB", "Nördliche Krone"],
        ["Crt", "Becher", { requiresDisambiguation: true }],
        ["Cru", "Kreuz des Südens"],
        ["Crv", "Rabe", { requiresDisambiguation: true }],
        ["Cyg", "Schwan", { requiresDisambiguation: true }],
        ["Del", "Delphin", { requiresDisambiguation: true }],
        ["Dor", "Schwertfisch", { requiresDisambiguation: true }],
        ["Dra", "Drache", { requiresDisambiguation: true }],
        ["Equ", "Füllen", { requiresDisambiguation: true }],
        ["Eri", "Eridanus", { requiresDisambiguation: true }],
        ["For", "Chemischer Ofen"],
        ["Gem", "Zwillinge", { requiresDisambiguation: true }],
        ["Gru", "Kranich", { requiresDisambiguation: true }],
        ["Her", "Herkules", { requiresDisambiguation: true }],
        ["Hor", "Pendeluhr", { requiresDisambiguation: true }],
        ["Hya", "Wasserschlange", { requiresDisambiguation: true }],
        ["Hyi", "Kleine Wasserschlange"],
        ["Ind", "Indianer", { requiresDisambiguation: true }],
        ["LMi", "Kleiner Löwe"],
        ["Lac", "Eidechse", { requiresDisambiguation: true }],
        ["Leo", "Löwe", { requiresDisambiguation: true }],
        ["Lep", "Hase", { requiresDisambiguation: true }],
        ["Lib", "Waage", { requiresDisambiguation: true }],
        ["Lup", "Wolf", { requiresDisambiguation: true }],
        ["Lyn", "Luchs", { requiresDisambiguation: true }],
        ["Lyr", "Leier", { requiresDisambiguation: true }],
        ["Men", "Tafelberg", { requiresDisambiguation: true }],
        ["Mic", "Mikroskop", { requiresDisambiguation: true }],
        ["Mon", "Einhorn", { requiresDisambiguation: true }],
        ["Mus", "Fliege", { requiresDisambiguation: true }],
        ["Nor", "Winkelmaß", { requiresDisambiguation: true }],
        ["Oct", "Oktant", { requiresDisambiguation: true }],
        ["Oph", "Schlangenträger"],
        ["Ori", "Orion", { requiresDisambiguation: true }],
        ["Pav", "Pfau", { requiresDisambiguation: true }],
        ["Peg", "Pegasus", { requiresDisambiguation: true }],
        ["Per", "Perseus", { requiresDisambiguation: true }],
        ["Phe", "Phönix", { requiresDisambiguation: true }],
        ["Pic", "Maler", { requiresDisambiguation: true }],
        ["PsA", "Südlicher Fisch"],
        ["Psc", "Fische", { requiresDisambiguation: true }],
        ["Pup", "Achterdeck des Schiffs"],
        ["Pyx", "Schiffskompass", { requiresDisambiguation: true }],
        ["Ret", "Netz", { requiresDisambiguation: true }],
        ["Scl", "Bildhauer", { requiresDisambiguation: true }],
        ["Sco", "Skorpion", { requiresDisambiguation: true }],
        ["Sct", "Schild", { requiresDisambiguation: true }],
        ["Ser", "Schlange", { requiresDisambiguation: true }],
        ["Sex", "Sextant", { requiresDisambiguation: true }],
        ["Sge", "Pfeil", { requiresDisambiguation: true }],
        ["Sgr", "Schütze", { requiresDisambiguation: true }],
        ["Tau", "Stier", { requiresDisambiguation: true }],
        ["Tel", "Teleskop", { requiresDisambiguation: true }],
        ["TrA", "Südliches Dreieck"],
        ["Tri", "Dreieck", { requiresDisambiguation: true }],
        ["Tuc", "Tukan", { requiresDisambiguation: true }],
        ["UMa", "Großer Bär"],
        ["UMi", "Kleiner Bär"],
        ["Vel", "Segel des Schiffs"],
        ["Vir", "Jungfrau", { requiresDisambiguation: true }],
        ["Vol", "Fliegender Fisch", { requiresDisambiguation: true }],
        ["Vul", "Fuchs", { requiresDisambiguation: true }]
      ].map(data => this._constellation(data, language)),
      en: [
        ["And", "Andromeda", { requiresDisambiguation: true }],
        ["Ant", "Antlia"],
        ["Aps", "Apus"],
        ["Aql", "Aquila", { requiresDisambiguation: true }],
        ["Aqr", "Aquarius", { requiresDisambiguation: true }],
        ["Ara", "Ara", { requiresDisambiguation: true }],
        ["Ari", "Aries", { requiresDisambiguation: true }],
        ["Aur", "Auriga", { requiresDisambiguation: true }],
        ["Boo", "Bo\u00f6tes"],
        ["CMa", "Canis Major"],
        ["CMi", "Canis Minor"],
        ["CVn", "Canes Venatici"],
        ["Cae", "Caelum"],
        ["Cam", "Camelopardalis"],
        ["Cap", "Capricornus"],
        ["Car", "Carina", { requiresDisambiguation: true }],
        ["Cas", "Cassiopeia", { requiresDisambiguation: true }],
        ["Cen", "Centaurus"],
        ["Cep", "Cepheus", { requiresDisambiguation: true }],
        ["Cet", "Cetus"],
        ["Cha", "Chamaeleon"],
        ["Cir", "Circinus"],
        ["Cnc", "Cancer", { requiresDisambiguation: true }],
        ["Col", "Columba", { requiresDisambiguation: true }],
        ["Com", "Coma Berenices"],
        ["CrA", "Corona Australis"],
        ["CrB", "Corona Borealis"],
        ["Crt", "Crater", { requiresDisambiguation: true }],
        ["Cru", "Crux"],
        ["Crv", "Corvus", { requiresDisambiguation: true }],
        ["Cyg", "Cygnus", { requiresDisambiguation: true }],
        ["Del", "Delphinus"],
        ["Dor", "Dorado"],
        ["Dra", "Draco", { requiresDisambiguation: true }],
        ["Equ", "Equuleus"],
        ["Eri", "Eridanus", { requiresDisambiguation: true }],
        ["For", "Fornax"],
        ["Gem", "Gemini", { requiresDisambiguation: true }],
        ["Gru", "Grus", { requiresDisambiguation: true }],
        ["Her", "Hercules", { requiresDisambiguation: true }],
        ["Hor", "Horologium", { requiresDisambiguation: true }],
        ["Hya", "Hydra", { requiresDisambiguation: true }],
        ["Hyi", "Hydrus"],
        ["Ind", "Indus", { requiresDisambiguation: true }],
        ["LMi", "Leo Minor"],
        ["Lac", "Lacerta"],
        ["Leo", "Leo", { requiresDisambiguation: true }],
        ["Lep", "Lepus", { requiresDisambiguation: true }],
        ["Lib", "Libra", { requiresDisambiguation: true }],
        ["Lup", "Lupus", { requiresDisambiguation: true }],
        ["Lyn", "Lynx", { requiresDisambiguation: true }],
        ["Lyr", "Lyra"],
        ["Men", "Mensa", { requiresDisambiguation: true }],
        ["Mic", "Microscopium"],
        ["Mon", "Monoceros"],
        ["Mus", "Musca"],
        ["Nor", "Norma", { requiresDisambiguation: true }],
        ["Oct", "Octans"],
        ["Oph", "Ophiuchus"],
        ["Ori", "Orion", { requiresDisambiguation: true }],
        ["Pav", "Pavo", { requiresDisambiguation: true }],
        ["Peg", "Pegasus", { requiresDisambiguation: true }],
        ["Per", "Perseus", { requiresDisambiguation: true }],
        ["Phe", "Phoenix", { requiresDisambiguation: true }],
        ["Pic", "Pictor"],
        ["PsA", "Piscis Austrinus"],
        ["Psc", "Pisces", { requiresDisambiguation: true }],
        ["Pup", "Puppis"],
        ["Pyx", "Pyxis"],
        ["Ret", "Reticulum"],
        ["Scl", "Sculptor", { requiresDisambiguation: true }],
        ["Sco", "Scorpius"],
        ["Sct", "Scutum", { requiresDisambiguation: true }],
        ["Ser", "Serpens"],
        ["Sex", "Sextans"],
        ["Sge", "Sagitta"],
        ["Sgr", "Sagittarius", { requiresDisambiguation: true }],
        ["Tau", "Taurus", { requiresDisambiguation: true }],
        ["Tel", "Telescopium"],
        ["TrA", "Triangulum Australe"],
        ["Tri", "Triangulum"],
        ["Tuc", "Tucana"],
        ["UMa", "Ursa Major"],
        ["UMi", "Ursa Minor"],
        ["Vel", "Vela", { requiresDisambiguation: true }],
        ["Vir", "Virgo", { requiresDisambiguation: true }],
        ["Vol", "Volans"],
        ["Vul", "Vulpecula"]
      ].map(data => this._constellation(data, language)),
      fr: [
        ["And", "Andromède", { requiresDisambiguation: true }],
        ["Ant", "Machine pneumatique"],
        ["Aps", "Oiseau de paradis", { requiresDisambiguation: true }],
        ["Aql", "Aigle", { requiresDisambiguation: true }],
        ["Aqr", "Verseau", { requiresDisambiguation: true }],
        ["Ara", "Autel", { requiresDisambiguation: true }],
        ["Ari", "Bélier", { requiresDisambiguation: true }],
        ["Aur", "Cocher", { requiresDisambiguation: true }],
        ["Boo", "Bouvier", { requiresDisambiguation: true }],
        ["CMa", "Grand Chien"],
        ["CMi", "Petit Chien", { requiresDisambiguation: true }],
        ["CVn", "Chiens de chasse", { requiresDisambiguation: true }],
        ["Cae", "Burin", { requiresDisambiguation: true }],
        ["Cam", "Girafe", { requiresDisambiguation: true }],
        ["Cap", "Capricorne", { requiresDisambiguation: true }],
        ["Car", "Carène", { requiresDisambiguation: true }],
        ["Cas", "Cassiopée", { requiresDisambiguation: true }],
        ["Cen", "Centaure", { requiresDisambiguation: true }],
        ["Cep", "Céphée", { requiresDisambiguation: true }],
        ["Cet", "Baleine", { requiresDisambiguation: true }],
        ["Cha", "Caméléon", { requiresDisambiguation: true }],
        ["Cir", "Compas", { requiresDisambiguation: true }],
        ["Cnc", "Cancer", { requiresDisambiguation: true }],
        ["Col", "Colombe", { requiresDisambiguation: true }],
        ["Com", "Coma Berenices"],
        ["CrA", "Couronne australe"],
        ["CrB", "Couronne boréale"],
        ["Crt", "Coupe", { requiresDisambiguation: true }],
        ["Cru", "Croix du Sud"],
        ["Crv", "Corbeau", { requiresDisambiguation: true }],
        ["Cyg", "Cygne", { requiresDisambiguation: true }],
        ["Del", "Dauphin", { requiresDisambiguation: true }],
        ["Dor", "Dorade", { requiresDisambiguation: true }],
        ["Dra", "Dragon", { requiresDisambiguation: true }],
        ["Equ", "Petit Cheval"],
        ["Eri", "Éridan", { requiresDisambiguation: true }],
        ["For", "Fourneau", { requiresDisambiguation: true }],
        ["Gem", "Gémeaux"],
        ["Gru", "Grue", { requiresDisambiguation: true }],
        ["Her", "Hercule", { requiresDisambiguation: true }],
        ["Hor", "Horloge", { requiresDisambiguation: true }],
        ["Hya", "Hydre", { requiresDisambiguation: true }],
        ["Hyi", "Hydre mâle"],
        ["Ind", "Indien", { requiresDisambiguation: true }],
        ["LMi", "Petit Lion"],
        ["Lac", "Lézard", { requiresDisambiguation: true }],
        ["Leo", "Lion", { requiresDisambiguation: true }],
        ["Lep", "Lepus", { requiresDisambiguation: true }],
        ["Lib", "Balance", { requiresDisambiguation: true }],
        ["Lup", "Loup", { requiresDisambiguation: true }],
        ["Lyn", "Lynx", { requiresDisambiguation: true }],
        ["Lyr", "Lyre", { requiresDisambiguation: true }],
        ["Men", "Table", { requiresDisambiguation: true }],
        ["Mic", "Microscope", { requiresDisambiguation: true }],
        ["Mon", "Licorne", { requiresDisambiguation: true }],
        ["Mus", "Mouche", { requiresDisambiguation: true }],
        ["Nor", "Règle", { requiresDisambiguation: true }],
        ["Oct", "Octant"],
        ["Oph", "Ophiuchus"],
        ["Ori", "Orion", { requiresDisambiguation: true }],
        ["Pav", "Paon", { requiresDisambiguation: true }],
        ["Peg", "Pégase", { requiresDisambiguation: true }],
        ["Per", "Persée", { requiresDisambiguation: true }],
        ["Phe", "Phénix", { requiresDisambiguation: true }],
        ["Pic", "Peintre", { requiresDisambiguation: true }],
        ["PsA", "Poisson austral"],
        ["Psc", "Poissons", { requiresDisambiguation: true }],
        ["Pup", "Poupe", { requiresDisambiguation: true }],
        ["Pyx", "Boussole", { requiresDisambiguation: true }],
        ["Ret", "Réticule", { requiresDisambiguation: true }],
        ["Scl", "Sculpteur", { requiresDisambiguation: true }],
        ["Sco", "Scorpion", { requiresDisambiguation: true }],
        ["Sct", "Écu de Sobieski"],
        ["Ser", "Serpent", { requiresDisambiguation: true }],
        ["Sex", "Sextant", { requiresDisambiguation: true }],
        ["Sge", "Flèche", { requiresDisambiguation: true }],
        ["Sgr", "Sagittaire", { requiresDisambiguation: true }],
        ["Tau", "Taureau", { requiresDisambiguation: true }],
        ["Tel", "Télescope", { requiresDisambiguation: true }],
        ["TrA", "Triangle austral"],
        ["Tri", "Triangle", { requiresDisambiguation: true }],
        ["Tuc", "Toucan", { requiresDisambiguation: true }],
        ["UMa", "Grande Ourse"],
        ["UMi", "Petit Ourse"],
        ["Vel", "Voiles", { requiresDisambiguation: true }],
        ["Vir", "Vierge", { requiresDisambiguation: true }],
        ["Vol", "Poisson volant", { requiresDisambiguation: true }],
        ["Vul", "Petit Renard"]
      ].map(data => this._constellation(data, language)),
      it: [
        ["And", "Andromeda", { requiresDisambiguation: true }],
        ["Ant", "Macchina Pneumatica"],
        ["Aps", "Uccello del Paradiso", { requiresDisambiguation: true }],
        ["Aql", "Aquila", { requiresDisambiguation: true }],
        ["Aqr", "Acquario", { requiresDisambiguation: true }],
        ["Ara", "Altare", { requiresDisambiguation: true }],
        ["Ari", "Ariete", { requiresDisambiguation: true }],
        ["Aur", "Auriga", { requiresDisambiguation: true }],
        ["Boo", "Boote"],
        ["CMa", "Cane maggiore"],
        ["CMi", "Cane minore"],
        ["CVn", "Cani da caccia", { requiresDisambiguation: true }],
        ["Cae", "Bulino", { requiresDisambiguation: true }],
        ["Cam", "Giraffa", { requiresDisambiguation: true }],
        ["Cap", "Capricorno", { requiresDisambiguation: true }],
        ["Car", "Carena", { requiresDisambiguation: true }],
        ["Cas", "Cassiopea", { requiresDisambiguation: true }],
        ["Cen", "Centauro", { requiresDisambiguation: true }],
        ["Cep", "Cefeo", { requiresDisambiguation: true }],
        ["Cet", "Balena", { requiresDisambiguation: true }],
        ["Cha", "Camaleonte", { requiresDisambiguation: true }],
        ["Cir", "Compasso", { requiresDisambiguation: true }],
        ["Cnc", "Cancro", { requiresDisambiguation: true }],
        ["Col", "Colomba", { requiresDisambiguation: true }],
        ["Com", "Chioma di Berenice", { requiresDisambiguation: true }],
        ["CrA", "Corona Australe"],
        ["CrB", "Corona Boreale"],
        ["Crt", "Cratere", { requiresDisambiguation: true }],
        ["Cru", "Croce del Sud"],
        ["Crv", "Corvo", { requiresDisambiguation: true }],
        ["Cyg", "Cigno", { requiresDisambiguation: true }],
        ["Del", "Delfino", { requiresDisambiguation: true }],
        ["Dor", "Dorado", { requiresDisambiguation: true }],
        ["Dra", "Drago", { requiresDisambiguation: true }],
        ["Equ", "Cavallino", { requiresDisambiguation: true }],
        ["Eri", "Eridano", { requiresDisambiguation: true }],
        ["For", "Fornace", { requiresDisambiguation: true }],
        ["Gem", "Gemelli", { requiresDisambiguation: true }],
        ["Gru", "Gru", { requiresDisambiguation: true }],
        ["Her", "Ercole", { requiresDisambiguation: true }],
        ["Hor", "Orologio", { requiresDisambiguation: true }],
        ["Hya", "Idra", { requiresDisambiguation: true }],
        ["Hyi", "Idra Maschio"],
        ["Ind", "Indiano", { requiresDisambiguation: true }],
        ["LMi", "Leone Minore"],
        ["Lac", "Lucertola", { requiresDisambiguation: true }],
        ["Leo", "Leone", { requiresDisambiguation: true }],
        ["Lep", "Lepre", { requiresDisambiguation: true }],
        ["Lib", "Bilancia", { requiresDisambiguation: true }],
        ["Lup", "Lupo", { requiresDisambiguation: true }],
        ["Lyn", "Lince", { requiresDisambiguation: true }],
        ["Lyr", "Lira", { requiresDisambiguation: true }],
        ["Men", "Mensa", { requiresDisambiguation: true }],
        ["Mic", "Microscopio", { requiresDisambiguation: true }],
        ["Mon", "Unicorno", { requiresDisambiguation: true }],
        ["Mus", "Mosca", { requiresDisambiguation: true }],
        ["Nor", "Regolo", { requiresDisambiguation: true }],
        ["Oct", "Ottante", { requiresDisambiguation: true }],
        ["Oph", "Ofiuco"],
        ["Ori", "Orione", { requiresDisambiguation: true }],
        ["Pav", "Pavone", { requiresDisambiguation: true }],
        ["Peg", "Pegaso", { requiresDisambiguation: true }],
        ["Per", "Perseo", { requiresDisambiguation: true }],
        ["Phe", "Fenice", { requiresDisambiguation: true }],
        ["Pic", "Pittore", { requiresDisambiguation: true }],
        ["PsA", "Pesce Australe"],
        ["Psc", "Pesci", { requiresDisambiguation: true }],
        ["Pup", "Poppa", { requiresDisambiguation: true }],
        ["Pyx", "Bussola", { requiresDisambiguation: true }],
        ["Ret", "Reticolo", { requiresDisambiguation: true }],
        ["Scl", "Scultore", { requiresDisambiguation: true }],
        ["Sco", "Scorpione", { requiresDisambiguation: true }],
        ["Sct", "Scudo", { requiresDisambiguation: true }],
        ["Ser", "Serpente", { requiresDisambiguation: true }],
        ["Sex", "Sestante", { requiresDisambiguation: true }],
        ["Sge", "Freccia", { requiresDisambiguation: true }],
        ["Sgr", "Sagittario", { requiresDisambiguation: true }],
        ["Tau", "Toro", { requiresDisambiguation: true }],
        ["Tel", "Telescopio", { requiresDisambiguation: true }],
        ["TrA", "Triangolo Australe"],
        ["Tri", "Triangolo", { requiresDisambiguation: true }],
        ["Tuc", "Tucano", { requiresDisambiguation: true }],
        ["UMa", "Orsa maggiore"],
        ["UMi", "Orsa minore"],
        ["Vel", "Vele", { requiresDisambiguation: true }],
        ["Vir", "Vergine", { requiresDisambiguation: true }],
        ["Vol", "Pesce Volante", { requiresDisambiguation: true }],
        ["Vul", "Volpetta", { requiresDisambiguation: true }]
      ].map(data => this._constellation(data, language)),
      es: [
        ["And", "Andromeda", { requiresDisambiguation: true }],
        ["Ant", "Antlia"],
        ["Aps", "Apus"],
        ["Aql", "Aquila", { requiresDisambiguation: true }],
        ["Aqr", "Aquarius", { requiresDisambiguation: true }],
        ["Ara", "Ara", { requiresDisambiguation: true }],
        ["Ari", "Aries", { requiresDisambiguation: true }],
        ["Aur", "Auriga", { requiresDisambiguation: true }],
        ["Boo", "Bo\u00f6tes"],
        ["CMa", "Canis Major"],
        ["CMi", "Canis Minor"],
        ["CVn", "Canes Venatici"],
        ["Cae", "Caelum"],
        ["Cam", "Camelopardalis"],
        ["Cap", "Capricornus"],
        ["Car", "Carina", { requiresDisambiguation: true }],
        ["Cas", "Cassiopeia", { requiresDisambiguation: true }],
        ["Cen", "Centaurus"],
        ["Cep", "Cepheus", { requiresDisambiguation: true }],
        ["Cet", "Cetus"],
        ["Cha", "Chamaeleon"],
        ["Cir", "Circinus"],
        ["Cnc", "Cancer", { requiresDisambiguation: true }],
        ["Col", "Columba", { requiresDisambiguation: true }],
        ["Com", "Coma Berenices"],
        ["CrA", "Corona Australis"],
        ["CrB", "Corona Borealis"],
        ["Crt", "Crater", { requiresDisambiguation: true }],
        ["Cru", "Crux"],
        ["Crv", "Corvus", { requiresDisambiguation: true }],
        ["Cyg", "Cygnus", { requiresDisambiguation: true }],
        ["Del", "Delphinus", { requiresDisambiguation: true }],
        ["Dor", "Dorado", { requiresDisambiguation: true }],
        ["Dra", "Draco", { requiresDisambiguation: true }],
        ["Equ", "Equuleus"],
        ["Eri", "Eridanus", { requiresDisambiguation: true }],
        ["For", "Fornax"],
        ["Gem", "Gemini", { requiresDisambiguation: true }],
        ["Gru", "Grus", { requiresDisambiguation: true }],
        ["Her", "Hercules", { requiresDisambiguation: true }],
        ["Hor", "Horologium"],
        ["Hya", "Hydra", { requiresDisambiguation: true }],
        ["Hyi", "Hydrus"],
        ["Ind", "Indus", { requiresDisambiguation: true }],
        ["LMi", "Leo Minor"],
        ["Lac", "Lacerta"],
        ["Leo", "Leo", { requiresDisambiguation: true }],
        ["Lep", "Lepus", { requiresDisambiguation: true }],
        ["Lib", "Libra", { requiresDisambiguation: true }],
        ["Lup", "Lupus", { requiresDisambiguation: true }],
        ["Lyn", "Lynx", { requiresDisambiguation: true }],
        ["Lyr", "Lyra"],
        ["Men", "Mensa", { requiresDisambiguation: true }],
        ["Mic", "Microscopium"],
        ["Mon", "Monoceros"],
        ["Mus", "Musca"],
        ["Nor", "Norma", { requiresDisambiguation: true }],
        ["Oct", "Octans"],
        ["Oph", "Ophiuchus"],
        ["Ori", "Orion", { requiresDisambiguation: true }],
        ["Pav", "Pavo", { requiresDisambiguation: true }],
        ["Peg", "Pegasus", { requiresDisambiguation: true }],
        ["Per", "Perseus", { requiresDisambiguation: true }],
        ["Phe", "Phoenix", { requiresDisambiguation: true }],
        ["Pic", "Pictor"],
        ["PsA", "Piscis Austrinus"],
        ["Psc", "Pisces", { requiresDisambiguation: true }],
        ["Pup", "Puppis"],
        ["Pyx", "Pyxis"],
        ["Ret", "Reticulum"],
        ["Scl", "Sculptor"],
        ["Sco", "Scorpius"],
        ["Sct", "Scutum", { requiresDisambiguation: true }],
        ["Ser", "Serpens"],
        ["Sex", "Sextans"],
        ["Sge", "Sagitta"],
        ["Sgr", "Sagittarius"],
        ["Tau", "Taurus", { requiresDisambiguation: true }],
        ["Tel", "Telescopium"],
        ["TrA", "Triangulum Australe"],
        ["Tri", "Triangulum"],
        ["Tuc", "Tucana"],
        ["UMa", "Ursa Major"],
        ["UMi", "Ursa Minor"],
        ["Vel", "Vela", { requiresDisambiguation: true }],
        ["Vir", "Virgo", { requiresDisambiguation: true }],
        ["Vol", "Volans"],
        ["Vul", "Vulpecula"]
      ].map(data => this._constellation(data, language))
    };
  }

  private _constellation(data: any, language: string): ConstellationInterface {
    const id: string = data[0] as string;
    const name: string = data[1] as string;
    const requiresDisambiguation = !!data[2] && (data[2] as any).requiresDisambiguation;
    const constellationDisambiguation = {
      de: "Sternbild",
      en: "constellation",
      fr: "constellation",
      it: "costellazione",
      es: "constelación"
    };

    if (this._availableLanguages.indexOf(this.translateService.currentLang) === -1) {
      language = "en"
    }

    return {
      id,
      name,
      data$: this.wikipediaApiService.getPageSummary(
        requiresDisambiguation ? `${name}_(${constellationDisambiguation[language]})` : name,
        language
      )
    };
  }
}
