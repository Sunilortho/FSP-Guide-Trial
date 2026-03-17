export type PatientScenario = {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: 'young' | 'middle' | 'elderly';
  greeting: string;
  complaint: string;
  history: string;
  category: string;
};

export const PATIENT_SCENARIOS: PatientScenario[] = [
  // FEMALE PATIENTS - NEUROLOGIE (5)
  { id: 'f_neuro_1', name: 'Frau Müller', gender: 'female', age: 'middle', greeting: 'Guten Tag, Herr Doktor. Ich bin Frau Müller.', complaint: 'Ich habe seit drei Tagen starke Kopfschmerzen und mir ist oft schwindelig.', history: 'Migräne in der Familie, keine bekannten Allergien, keine regelmäßige Medikation.', category: 'Neurologie' },
  { id: 'f_neuro_2', name: 'Frau Hoffmann', gender: 'female', age: 'elderly', greeting: 'Guten Tag, Hoffmann mein Name.', complaint: 'Ich habe seit gestern Morgen Taubheitsgefühle in der rechten Hand und im Arm.', history: 'Bluthochdruck, Vorhofflimmern, nimmt Marcumar.', category: 'Neurologie' },
  { id: 'f_neuro_3', name: 'Frau Becker', gender: 'female', age: 'young', greeting: 'Hallo, ich bin Sophie Becker.', complaint: 'Ich sehe seit heute Morgen alles doppelt und habe starke Kopfschmerzen mit Übelkeit.', history: 'Keine Vorerkrankungen, nimmt die Pille, raucht gelegentlich.', category: 'Neurologie' },
  { id: 'f_neuro_4', name: 'Frau Zimmermann', gender: 'female', age: 'middle', greeting: 'Grüß Gott, Zimmermann ist mein Name.', complaint: 'Ich habe immer wieder Schwindelanfälle, besonders wenn ich den Kopf drehe.', history: 'Bekannter Tinnitus, Hörsturz vor 2 Jahren.', category: 'Neurologie' },
  { id: 'f_neuro_5', name: 'Frau Krause', gender: 'female', age: 'elderly', greeting: 'Guten Tag, ich bin Frau Krause.', complaint: 'Mein Gedächtnis lässt nach. Ich vergesse ständig Termine und Namen.', history: 'Depression behandelt, Schilddrüsenunterfunktion, nimmt L-Thyroxin.', category: 'Neurologie' },

  // FEMALE PATIENTS - KARDIOLOGIE (5)
  { id: 'f_kardio_1', name: 'Frau Schmidt', gender: 'female', age: 'elderly', greeting: 'Grüß Gott, Herr Doktor. Schmidt ist mein Name.', complaint: 'Also, ich habe seit einer Woche so ein Druckgefühl in der Brust. Das macht mir Sorgen.', history: 'Bluthochdruck seit 10 Jahren, nimmt Ramipril, Diabetes Typ 2.', category: 'Kardiologie' },
  { id: 'f_kardio_2', name: 'Frau Neumann', gender: 'female', age: 'middle', greeting: 'Guten Tag, Neumann mein Name.', complaint: 'Mein Herz stolpert manchmal, besonders abends. Das beunruhigt mich sehr.', history: 'Schilddrüsenüberfunktion, nimmt Carbimazol, viel Kaffee.', category: 'Kardiologie' },
  { id: 'f_kardio_3', name: 'Frau Schwarz', gender: 'female', age: 'elderly', greeting: 'Guten Tag, ich heiße Schwarz.', complaint: 'Ich bekomme beim Treppensteigen keine Luft mehr und meine Beine schwellen an.', history: 'Herzinsuffizienz NYHA II, nimmt Diuretika und ACE-Hemmer.', category: 'Kardiologie' },
  { id: 'f_kardio_4', name: 'Frau Werner', gender: 'female', age: 'young', greeting: 'Hallo, Werner ist mein Name.', complaint: 'Ich habe seit heute Morgen Herzrasen und mir ist ganz flau.', history: 'Keine Vorerkrankungen, viel Sport, Energy-Drinks.', category: 'Kardiologie' },
  { id: 'f_kardio_5', name: 'Frau Hartmann', gender: 'female', age: 'middle', greeting: 'Guten Tag Herr Doktor, Hartmann.', complaint: 'Der Blutdruck ist zu Hause immer sehr hoch, über 160.', history: 'Familiärer Bluthochdruck, Übergewicht, keine Medikamente bisher.', category: 'Kardiologie' },

  // FEMALE PATIENTS - CHIRURGIE/GASTRO (5)
  { id: 'f_chir_1', name: 'Frau Weber', gender: 'female', age: 'young', greeting: 'Hallo, ich bin Lisa Weber.', complaint: 'Ich habe seit gestern starke Bauchschmerzen, hier unten rechts. Mir ist auch ein bisschen übel.', history: 'Keine Vorerkrankungen, keine Allergien, nimmt nur die Pille.', category: 'Chirurgie' },
  { id: 'f_chir_2', name: 'Frau Koch', gender: 'female', age: 'middle', greeting: 'Guten Tag, Koch mein Name.', complaint: 'Ich habe kolikartige Schmerzen im rechten Oberbauch, besonders nach fettigem Essen.', history: 'Gallensteine bekannt, nimmt Buscopan bei Bedarf.', category: 'Chirurgie' },
  { id: 'f_chir_3', name: 'Frau Richter', gender: 'female', age: 'elderly', greeting: 'Grüß Gott, Richter ist mein Name.', complaint: 'Ich habe eine Beule in der Leiste, die beim Husten größer wird.', history: 'Chronische Bronchitis, nimmt Spiriva, Verstopfung häufig.', category: 'Chirurgie' },
  { id: 'f_gastro_1', name: 'Frau Schneider', gender: 'female', age: 'middle', greeting: 'Guten Tag, ich bin Frau Schneider.', complaint: 'Ich habe seit zwei Wochen Sodbrennen und Magenschmerzen, besonders nach dem Essen.', history: 'Helicobacter pylori vor 5 Jahren behandelt, nimmt gelegentlich Ibuprofen.', category: 'Gastroenterologie' },
  { id: 'f_gastro_2', name: 'Frau Lange', gender: 'female', age: 'young', greeting: 'Hallo, Lange mein Name.', complaint: 'Ich habe seit Wochen Durchfall und Bauchkrämpfe, oft mit Blut im Stuhl.', history: 'Keine Vorerkrankungen, Auslandsreise vor 2 Monaten.', category: 'Gastroenterologie' },

  // FEMALE PATIENTS - PNEUMOLOGIE (5)
  { id: 'f_pulmo_1', name: 'Frau Fischer', gender: 'female', age: 'middle', greeting: 'Guten Tag, Fischer mein Name.', complaint: 'Ich huste seit zwei Wochen und bekomme schlecht Luft, besonders nachts.', history: 'Raucherin seit 20 Jahren, COPD diagnostiziert, nimmt Salbutamol bei Bedarf.', category: 'Pneumologie' },
  { id: 'f_pulmo_2', name: 'Frau Schröder', gender: 'female', age: 'young', greeting: 'Hallo, ich bin Anna Schröder.', complaint: 'Ich bekomme plötzlich keine Luft, besonders bei Anstrengung oder wenn es kalt ist.', history: 'Heuschnupfen, Neurodermitis als Kind, Katzenallergie.', category: 'Pneumologie' },
  { id: 'f_pulmo_3', name: 'Frau Lehmann', gender: 'female', age: 'elderly', greeting: 'Guten Tag, Lehmann ist mein Name.', complaint: 'Ich huste seit drei Wochen Schleim und habe abends immer Fieber.', history: 'Diabetes Typ 2, Herzinsuffizienz, nimmt viele Medikamente.', category: 'Pneumologie' },
  { id: 'f_pulmo_4', name: 'Frau Köhler', gender: 'female', age: 'middle', greeting: 'Grüß Gott, Köhler mein Name.', complaint: 'Ich habe nachts Hustenanfälle und pfeife beim Atmen.', history: 'Asthma seit Kindheit, Kortison-Spray, Allergien gegen Hausstaubmilben.', category: 'Pneumologie' },
  { id: 'f_pulmo_5', name: 'Frau König', gender: 'female', age: 'young', greeting: 'Hallo, König ist mein Name.', complaint: 'Ich habe seit einer Woche Husten mit gelbem Auswurf und Fieber bis 39 Grad.', history: 'Keine Vorerkrankungen, arbeitet im Kindergarten.', category: 'Pneumologie' },

  // FEMALE PATIENTS - ORTHOPÄDIE (4)
  { id: 'f_ortho_1', name: 'Frau Fuchs', gender: 'female', age: 'elderly', greeting: 'Guten Tag, Fuchs mein Name.', complaint: 'Meine Knie tun so weh, besonders beim Aufstehen und Treppensteigen.', history: 'Arthrose beidseits, nimmt Ibuprofen regelmäßig, Osteoporose.', category: 'Orthopädie' },
  { id: 'f_ortho_2', name: 'Frau Scholz', gender: 'female', age: 'middle', greeting: 'Guten Tag, ich bin Frau Scholz.', complaint: 'Ich habe Schmerzen im Nacken, die in den Arm ausstrahlen und kribbeln.', history: 'Büroarbeit, viel Computerarbeit, Verspannungen häufig.', category: 'Orthopädie' },
  { id: 'f_ortho_3', name: 'Frau Möller', gender: 'female', age: 'young', greeting: 'Hallo, Möller ist mein Name.', complaint: 'Meine Schulter schmerzt seit dem Handballtraining, ich kann den Arm kaum heben.', history: 'Sportlerin, früher Schulterluxation rechts.', category: 'Orthopädie' },
  { id: 'f_ortho_4', name: 'Frau Friedrich', gender: 'female', age: 'middle', greeting: 'Grüß Gott, Friedrich mein Name.', complaint: 'Mein unterer Rücken schmerzt seit Wochen, besonders morgens bin ich ganz steif.', history: 'Sitzende Tätigkeit, leichtes Übergewicht, keine Vorerkrankungen.', category: 'Orthopädie' },

  // FEMALE PATIENTS - UROLOGIE/GYNÄKOLOGIE (4)
  { id: 'f_uro_1', name: 'Frau Weiß', gender: 'female', age: 'young', greeting: 'Hallo, Weiß ist mein Name.', complaint: 'Es brennt beim Wasserlassen und ich muss ständig auf die Toilette.', history: 'Häufige Blasenentzündungen, trinkt wenig, sexuell aktiv.', category: 'Urologie' },
  { id: 'f_uro_2', name: 'Frau Peters', gender: 'female', age: 'elderly', greeting: 'Guten Tag, Peters mein Name.', complaint: 'Ich verliere manchmal Urin, wenn ich huste oder niese.', history: 'Drei Geburten, Gebärmuttersenkung bekannt, nimmt keine Medikamente.', category: 'Urologie' },
  { id: 'f_gyn_1', name: 'Frau Graf', gender: 'female', age: 'young', greeting: 'Hallo, ich bin Frau Graf.', complaint: 'Ich habe starke Regelschmerzen und die Blutung ist sehr stark.', history: 'Unregelmäßiger Zyklus seit Jahren, nimmt keine Hormone.', category: 'Gynäkologie' },
  { id: 'f_gyn_2', name: 'Frau Meyer', gender: 'female', age: 'middle', greeting: 'Guten Tag, Meyer ist mein Name.', complaint: 'Ich habe Hitzewallungen und Schlafstörungen seit einigen Monaten.', history: 'Wechseljahre, letzte Periode vor 6 Monaten, keine Vorerkrankungen.', category: 'Gynäkologie' },

  // FEMALE PATIENTS - PSYCHIATRIE (3)
  { id: 'f_psych_1', name: 'Frau Schulze', gender: 'female', age: 'young', greeting: 'Hallo, Schulze ist mein Name.', complaint: 'Ich fühle mich seit Wochen so antriebslos und traurig, kann nicht mehr schlafen.', history: 'Studentin, Prüfungsstress, keine psychiatrische Vorgeschichte.', category: 'Psychiatrie' },
  { id: 'f_psych_2', name: 'Frau Berger', gender: 'female', age: 'middle', greeting: 'Guten Tag, Berger mein Name.', complaint: 'Ich habe Panikattacken, plötzlich bekomme ich keine Luft und das Herz rast.', history: 'Angststörung vor 5 Jahren, damals Therapie, jetzt wieder Symptome.', category: 'Psychiatrie' },
  { id: 'f_psych_3', name: 'Frau Keller', gender: 'female', age: 'elderly', greeting: 'Guten Tag, ich bin Frau Keller.', complaint: 'Ich kann nicht mehr schlafen und habe keine Freude mehr an nichts.', history: 'Ehemann vor 6 Monaten verstorben, lebt allein, keine Vormedikation.', category: 'Psychiatrie' },

  // FEMALE PATIENTS - DERMATOLOGIE (3)
  { id: 'f_derm_1', name: 'Frau Braun', gender: 'female', age: 'young', greeting: 'Hallo, ich bin Lisa Braun.', complaint: 'Ich habe einen juckenden Ausschlag am ganzen Körper seit einer Woche.', history: 'Neurodermitis als Kind, neue Waschmittelmarke verwendet.', category: 'Dermatologie' },
  { id: 'f_derm_2', name: 'Frau Wolf', gender: 'female', age: 'middle', greeting: 'Guten Tag, Wolf mein Name.', complaint: 'Ich habe ein Muttermal, das sich verändert hat und manchmal blutet.', history: 'Viele Sonnenbrände in der Jugend, heller Hauttyp.', category: 'Dermatologie' },
  { id: 'f_derm_3', name: 'Frau Sommer', gender: 'female', age: 'elderly', greeting: 'Grüß Gott, Sommer ist mein Name.', complaint: 'Meine Haut juckt ständig und ist ganz trocken, besonders an den Beinen.', history: 'Diabetes Typ 2, Niereninsuffizienz Stadium 2, nimmt viele Medikamente.', category: 'Dermatologie' },

  // MALE PATIENTS - KARDIOLOGIE (5)
  { id: 'm_kardio_1', name: 'Herr Müller', gender: 'male', age: 'middle', greeting: 'Guten Tag, Herr Doktor. Müller ist mein Name.', complaint: 'Ich habe seit gestern Abend starke Brustschmerzen. Die strahlen auch in den linken Arm aus.', history: 'Raucher seit 25 Jahren, Bluthochdruck, erhöhte Cholesterinwerte, nimmt Simvastatin.', category: 'Kardiologie' },
  { id: 'm_kardio_2', name: 'Herr Fischer', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Fischer mein Name.', complaint: 'Ich bekomme beim Gehen keine Luft mehr und muss oft stehen bleiben.', history: 'Herzinfarkt vor 5 Jahren, 3 Stents, nimmt ASS, Betablocker, Statin.', category: 'Kardiologie' },
  { id: 'm_kardio_3', name: 'Herr Weber', gender: 'male', age: 'middle', greeting: 'Guten Tag, Weber ist mein Name.', complaint: 'Mein Herz schlägt unregelmäßig und ich fühle mich oft erschöpft.', history: 'Vorhofflimmern bekannt, nimmt Xarelto, Betablocker.', category: 'Kardiologie' },
  { id: 'm_kardio_4', name: 'Herr Schäfer', gender: 'male', age: 'young', greeting: 'Hallo, Schäfer ist mein Name.', complaint: 'Ich hatte gestern beim Sport plötzlich Herzrasen und bin fast ohnmächtig geworden.', history: 'Leistungssportler, keine Vorerkrankungen, Großvater plötzlicher Herztod.', category: 'Kardiologie' },
  { id: 'm_kardio_5', name: 'Herr Hofmann', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Hofmann mein Name.', complaint: 'Meine Beine sind abends immer ganz geschwollen und ich bin kurzatmig.', history: 'Herzinsuffizienz, Diabetes, Niereninsuffizienz, viele Medikamente.', category: 'Kardiologie' },

  // MALE PATIENTS - ORTHOPÄDIE (5)
  { id: 'm_ortho_1', name: 'Herr Schmidt', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Schmidt mein Name.', complaint: 'Mein Rücken macht mir große Probleme. Die Schmerzen ziehen bis ins Bein runter.', history: 'Bandscheibenvorfall vor 10 Jahren, Arthrose, nimmt Ibuprofen bei Bedarf.', category: 'Orthopädie' },
  { id: 'm_ortho_2', name: 'Herr Bauer', gender: 'male', age: 'middle', greeting: 'Guten Tag, Bauer ist mein Name.', complaint: 'Meine Schulter schmerzt nachts so stark, dass ich nicht schlafen kann.', history: 'Handwerker, viel Überkopfarbeit, keine Vorerkrankungen.', category: 'Orthopädie' },
  { id: 'm_ortho_3', name: 'Herr Richter', gender: 'male', age: 'young', greeting: 'Hallo, ich bin Richter.', complaint: 'Mein Knie ist seit dem Fußballspiel geschwollen und instabil.', history: 'Sportler, Kreuzbandriss links vor 3 Jahren, operiert.', category: 'Orthopädie' },
  { id: 'm_ortho_4', name: 'Herr Krüger', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Krüger mein Name.', complaint: 'Ich habe starke Hüftschmerzen und hinke beim Gehen.', history: 'Coxarthrose beidseits, Diabetes, Bluthochdruck.', category: 'Orthopädie' },
  { id: 'm_ortho_5', name: 'Herr Schmitt', gender: 'male', age: 'middle', greeting: 'Grüß Gott, Schmitt ist mein Name.', complaint: 'Ich habe ein Kribbeln und Taubheitsgefühl in beiden Händen, besonders nachts.', history: 'Büroarbeit, viel am Computer, leichtes Übergewicht.', category: 'Orthopädie' },

  // MALE PATIENTS - INNERE MEDIZIN (5)
  { id: 'm_innere_1', name: 'Herr Wagner', gender: 'male', age: 'middle', greeting: 'Hallo, Wagner ist mein Name.', complaint: 'Ich bin ständig müde und muss viel trinken. Außerdem habe ich in letzter Zeit stark abgenommen.', history: 'Übergewicht, Vater und Großvater hatten Diabetes.', category: 'Innere Medizin' },
  { id: 'm_innere_2', name: 'Herr Becker', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Becker ist mein Name.', complaint: 'Ich fühle mich seit Wochen schwach und habe keinen Appetit mehr.', history: 'Raucher seit 40 Jahren, Gewichtsverlust 5 kg in 2 Monaten.', category: 'Innere Medizin' },
  { id: 'm_innere_3', name: 'Herr Lorenz', gender: 'male', age: 'middle', greeting: 'Grüß Gott, Lorenz mein Name.', complaint: 'Mein Blutzucker ist immer zu hoch, obwohl ich die Tabletten nehme.', history: 'Diabetes Typ 2 seit 10 Jahren, Metformin, Übergewicht.', category: 'Innere Medizin' },
  { id: 'm_innere_4', name: 'Herr Krämer', gender: 'male', age: 'young', greeting: 'Hallo, Krämer ist mein Name.', complaint: 'Ich habe Fieber, Gelenkschmerzen und einen roten Fleck am Bein, der größer wird.', history: 'Zeckenbiss vor 2 Wochen, sonst gesund.', category: 'Innere Medizin' },
  { id: 'm_innere_5', name: 'Herr Vogt', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Vogt ist mein Name.', complaint: 'Ich schwitze nachts so stark, dass ich das Bett wechseln muss.', history: 'Gewichtsverlust, Müdigkeit, keine bekannten Vorerkrankungen.', category: 'Innere Medizin' },

  // MALE PATIENTS - UNFALLCHIRURGIE (4)
  { id: 'm_unfall_1', name: 'Herr Klein', gender: 'male', age: 'young', greeting: 'Hallo, ich bin Thomas Klein.', complaint: 'Ich bin beim Fußball umgeknickt. Der Knöchel ist stark geschwollen und ich kann kaum auftreten.', history: 'Sportler, früher schon mal denselben Knöchel verstaucht.', category: 'Unfallchirurgie' },
  { id: 'm_unfall_2', name: 'Herr Maier', gender: 'male', age: 'middle', greeting: 'Guten Tag, Maier ist mein Name.', complaint: 'Ich bin von der Leiter gefallen und habe starke Schmerzen im Handgelenk.', history: 'Handwerker, keine Vorerkrankungen, Blutdruckmittel.', category: 'Unfallchirurgie' },
  { id: 'm_unfall_3', name: 'Herr Schulz', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Schulz mein Name.', complaint: 'Ich bin gestürzt und habe starke Schmerzen in der Hüfte.', history: 'Osteoporose, Marcumar wegen Vorhofflimmern, Gehstock.', category: 'Unfallchirurgie' },
  { id: 'm_unfall_4', name: 'Herr Franke', gender: 'male', age: 'young', greeting: 'Hallo, Franke ist mein Name.', complaint: 'Ich habe mir beim Snowboarden die Schulter ausgekugelt.', history: 'Sportler, Schulterluxation derselben Seite vor 2 Jahren.', category: 'Unfallchirurgie' },

  // MALE PATIENTS - PSYCHIATRIE (4)
  { id: 'm_psych_1', name: 'Herr Braun', gender: 'male', age: 'young', greeting: 'Hallo, Braun mein Name.', complaint: 'Ich habe plötzlich Herzrasen und Atemnot, obwohl ich nichts mache. Das macht mir Angst.', history: 'Viel Stress bei der Arbeit, trinkt viel Kaffee, keine Vorerkrankungen.', category: 'Psychiatrie' },
  { id: 'm_psych_2', name: 'Herr Seidel', gender: 'male', age: 'middle', greeting: 'Guten Tag, Seidel ist mein Name.', complaint: 'Ich kann nicht mehr schlafen und trinke abends immer mehr Alkohol.', history: 'Scheidung vor 6 Monaten, Jobverlust, früher keine Probleme.', category: 'Psychiatrie' },
  { id: 'm_psych_3', name: 'Herr Zimmermann', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Zimmermann mein Name.', complaint: 'Ich habe keine Freude mehr am Leben und denke oft, dass alles sinnlos ist.', history: 'Ehefrau vor einem Jahr verstorben, lebt allein, Diabetes.', category: 'Psychiatrie' },
  { id: 'm_psych_4', name: 'Herr Otto', gender: 'male', age: 'young', greeting: 'Hallo, Otto ist mein Name.', complaint: 'Ich habe ständig Angst, dass etwas Schlimmes passiert, und kann mich nicht konzentrieren.', history: 'Student, Prüfungsangst, Schlafstörungen seit Monaten.', category: 'Psychiatrie' },

  // MALE PATIENTS - GASTROENTEROLOGIE (4)
  { id: 'm_gastro_1', name: 'Herr Neumann', gender: 'male', age: 'middle', greeting: 'Guten Tag, Neumann ist mein Name.', complaint: 'Ich habe seit Wochen Sodbrennen und ein Druckgefühl im Magen.', history: 'Übergewicht, viel Stress, raucht, trinkt Alkohol regelmäßig.', category: 'Gastroenterologie' },
  { id: 'm_gastro_2', name: 'Herr Schwarz', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Schwarz mein Name.', complaint: 'Ich habe Blut im Stuhl bemerkt und Bauchschmerzen.', history: 'Darmspiegelung vor 5 Jahren unauffällig, Hämorrhoiden bekannt.', category: 'Gastroenterologie' },
  { id: 'm_gastro_3', name: 'Herr Werner', gender: 'male', age: 'young', greeting: 'Hallo, Werner ist mein Name.', complaint: 'Ich habe starke Bauchkrämpfe und Durchfall, besonders nach dem Essen.', history: 'Keine Vorerkrankungen, neue Arbeitsstelle mit viel Stress.', category: 'Gastroenterologie' },
  { id: 'm_gastro_4', name: 'Herr Hartmann', gender: 'male', age: 'middle', greeting: 'Guten Tag, Hartmann ist mein Name.', complaint: 'Meine Haut und Augen sind gelblich geworden und ich habe keinen Appetit.', history: 'Früher viel Alkohol getrunken, seit 2 Jahren abstinent.', category: 'Gastroenterologie' },

  // MALE PATIENTS - UROLOGIE (4)
  { id: 'm_uro_1', name: 'Herr Meyer', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Meyer ist mein Name.', complaint: 'Ich muss nachts fünfmal zur Toilette und der Strahl ist ganz schwach.', history: 'Prostatavergrößerung bekannt, nimmt Tamsulosin.', category: 'Urologie' },
  { id: 'm_uro_2', name: 'Herr Lange', gender: 'male', age: 'middle', greeting: 'Grüß Gott, Lange mein Name.', complaint: 'Ich habe starke Schmerzen in der Seite, die in die Leiste ausstrahlen.', history: 'Nierensteine vor 3 Jahren, trinkt wenig, viel Fleisch.', category: 'Urologie' },
  { id: 'm_uro_3', name: 'Herr Kraus', gender: 'male', age: 'young', greeting: 'Hallo, Kraus ist mein Name.', complaint: 'Es brennt beim Wasserlassen und ich habe Ausfluss.', history: 'Sexuell aktiv, keine Vorerkrankungen.', category: 'Urologie' },
  { id: 'm_uro_4', name: 'Herr Heinrich', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Heinrich ist mein Name.', complaint: 'Ich habe Blut im Urin bemerkt, keine Schmerzen.', history: 'Raucher, 60 Jahre, PSA leicht erhöht vor 6 Monaten.', category: 'Urologie' },

  // MALE PATIENTS - NEUROLOGIE (4)
  { id: 'm_neuro_1', name: 'Herr Koch', gender: 'male', age: 'middle', greeting: 'Guten Tag, Koch ist mein Name.', complaint: 'Ich habe plötzlich mein rechtes Auge nicht mehr richtig sehen können.', history: 'Bluthochdruck, Diabetes, raucht, Übergewicht.', category: 'Neurologie' },
  { id: 'm_neuro_2', name: 'Herr Schreiber', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Schreiber mein Name.', complaint: 'Meine Hände zittern immer mehr und ich werde langsamer beim Gehen.', history: 'Keine bekannten Vorerkrankungen, Vater hatte Parkinson.', category: 'Neurologie' },
  { id: 'm_neuro_3', name: 'Herr Berg', gender: 'male', age: 'young', greeting: 'Hallo, Berg ist mein Name.', complaint: 'Ich habe heftige Kopfschmerzen mit Übelkeit und bin lichtempfindlich.', history: 'Migräne in der Familie, viel Stress, wenig Schlaf.', category: 'Neurologie' },
  { id: 'm_neuro_4', name: 'Herr Engel', gender: 'male', age: 'middle', greeting: 'Guten Tag, Engel ist mein Name.', complaint: 'Ich hatte gestern einen Krampfanfall, zum ersten Mal in meinem Leben.', history: 'Keine Vorerkrankungen, wenig Schlaf in letzter Zeit, viel Alkohol am Wochenende.', category: 'Neurologie' },

  // MALE PATIENTS - PNEUMOLOGIE (3)
  { id: 'm_pulmo_1', name: 'Herr Hoffmann', gender: 'male', age: 'elderly', greeting: 'Guten Tag, Hoffmann ist mein Name.', complaint: 'Ich huste seit Monaten und habe dabei manchmal Blut im Auswurf.', history: 'Raucher seit 45 Jahren, COPD, Gewichtsverlust.', category: 'Pneumologie' },
  { id: 'm_pulmo_2', name: 'Herr Kraft', gender: 'male', age: 'middle', greeting: 'Grüß Gott, Kraft mein Name.', complaint: 'Ich bekomme bei der Arbeit schlecht Luft und huste abends viel.', history: 'Arbeitet mit Asbest, Ex-Raucher seit 5 Jahren.', category: 'Pneumologie' },
  { id: 'm_pulmo_3', name: 'Herr Haas', gender: 'male', age: 'young', greeting: 'Hallo, Haas ist mein Name.', complaint: 'Ich habe seit drei Tagen Fieber, Husten und fühle mich sehr schwach.', history: 'Keine Vorerkrankungen, arbeitet im Großraumbüro, Kollegen auch krank.', category: 'Pneumologie' },

  // MALE PATIENTS - HNO (3)
  { id: 'm_hno_1', name: 'Herr Fuchs', gender: 'male', age: 'middle', greeting: 'Guten Tag, Fuchs ist mein Name.', complaint: 'Ich höre auf dem rechten Ohr plötzlich viel schlechter und habe ein Rauschen.', history: 'Viel Stress bei der Arbeit, Bluthochdruck, keine HNO-Vorgeschichte.', category: 'HNO' },
  { id: 'm_hno_2', name: 'Herr Wolf', gender: 'male', age: 'young', greeting: 'Hallo, Wolf ist mein Name.', complaint: 'Ich habe starke Halsschmerzen, Fieber und kann kaum schlucken.', history: 'Keine Vorerkrankungen, letzte Angina vor 2 Jahren.', category: 'HNO' },
  { id: 'm_hno_3', name: 'Herr Schuster', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Schuster mein Name.', complaint: 'Meine Nase ist ständig verstopft und ich schnarche sehr laut.', history: 'Nasenpolypen vor 10 Jahren operiert, Allergie gegen Gräser.', category: 'HNO' },

  // MALE PATIENTS - DERMATOLOGIE (2)
  { id: 'm_derm_1', name: 'Herr Vogel', gender: 'male', age: 'middle', greeting: 'Guten Tag, Vogel ist mein Name.', complaint: 'Ich habe schuppige, rote Stellen an den Ellenbogen und Knien.', history: 'Vater hatte Psoriasis, viel Stress, raucht.', category: 'Dermatologie' },
  { id: 'm_derm_2', name: 'Herr Kunz', gender: 'male', age: 'elderly', greeting: 'Grüß Gott, Kunz mein Name.', complaint: 'Ich habe eine Wunde am Bein, die seit Wochen nicht heilt.', history: 'Diabetes seit 20 Jahren, Durchblutungsstörungen, Raucher.', category: 'Dermatologie' },
];
