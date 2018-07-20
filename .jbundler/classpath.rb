require 'jar_dependencies'
JBUNDLER_LOCAL_REPO = Jars.home
JBUNDLER_JRUBY_CLASSPATH = []
JBUNDLER_JRUBY_CLASSPATH.freeze
JBUNDLER_TEST_CLASSPATH = []
JBUNDLER_TEST_CLASSPATH.freeze
JBUNDLER_CLASSPATH = []
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/org/apache/pdfbox/fontbox/2.0.9/fontbox-2.0.9.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/org/apache/commons/commons-csv/1.4/commons-csv-1.4.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/commons-cli/commons-cli/1.4/commons-cli-1.4.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/org/bouncycastle/bcprov-jdk15on/1.56/bcprov-jdk15on-1.56.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/jline/jline/2.11/jline-2.11.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/org/locationtech/jts/jts-core/1.15.0/jts-core-1.15.0.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/org/slf4j/slf4j-simple/1.7.25/slf4j-simple-1.7.25.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/org/bouncycastle/bcmail-jdk15on/1.56/bcmail-jdk15on-1.56.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/org/bouncycastle/bcpkix-jdk15on/1.56/bcpkix-jdk15on-1.56.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/org/apache/pdfbox/pdfbox/2.0.9/pdfbox-2.0.9.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/org/slf4j/slf4j-api/1.7.25/slf4j-api-1.7.25.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/commons-logging/commons-logging/1.2/commons-logging-1.2.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/com/google/code/gson/gson/2.8.0/gson-2.8.0.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/com/github/jai-imageio/jai-imageio-core/1.3.1/jai-imageio-core-1.3.1.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/org/yaml/snakeyaml/1.18/snakeyaml-1.18.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/technology/tabula/tabula/1.0.2/tabula-1.0.2.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/com/github/jai-imageio/jai-imageio-jpeg2000/1.3.0/jai-imageio-jpeg2000-1.3.0.jar')
JBUNDLER_CLASSPATH << (JBUNDLER_LOCAL_REPO + '/com/levigo/jbig2/levigo-jbig2-imageio/2.0/levigo-jbig2-imageio-2.0.jar')
JBUNDLER_CLASSPATH.freeze
