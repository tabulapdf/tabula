import org.junit.After;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.concurrent.TimeUnit;

import static junit.framework.TestCase.assertTrue;

//
public class TestHelpPage {
    WebDriver driver;
    @Test
    public void startWebDriver() throws InterruptedException{
        driver = new FirefoxDriver();
        driver.get("http://127.0.0.1:9292/");
        WebDriverWait wait = new WebDriverWait(driver, 100);

        try{
            //navigates to the help tab from the homepage
            By help_id = By.linkText("Help");
            WebElement help_icon = wait.until(ExpectedConditions.visibilityOfElementLocated(help_id));
            help_icon.click();
            WebElement help_icon2 = wait.until(ExpectedConditions.visibilityOfElementLocated(help_id));
            help_icon2.click();
            String help_title = "How to Use Tabula";
            By tabulahelp_id = By.id("tabulahelp");
            WebElement helptabula = wait.until(ExpectedConditions.visibilityOfElementLocated(tabulahelp_id));
            assertTrue("Failed, couldn't find Help page", help_title.equals(helptabula.getText()));

            //the following three sections click on each menu option on the help page to navigate to that specific
            // section, then it checks if it foudn the corresponding title for that section
            By howtotabula = By.linkText("How To Use Tabula");
            WebElement howto_link = wait.until(ExpectedConditions.visibilityOfElementLocated(howtotabula));
            howto_link.click();
            String help_title2 = "How to Use Tabula";
            By tabulahelp_id2 = By.id("tabulahelp");
            WebElement helptabula2 = wait.until(ExpectedConditions.visibilityOfElementLocated(tabulahelp_id2));
            assertTrue("Failed, couldn't find How to Use Tabula section", help_title2.equals(helptabula2.getText()));
            Thread.sleep(3000);

            By regexhelptabula = By.linkText("Regex Help");
            WebElement regexhelp_link = wait.until(ExpectedConditions.visibilityOfElementLocated(regexhelptabula));
            regexhelp_link.click();
            String regexhelp_title = "Regex Help";
            By regexhelp_id = By.id("regexhelp");
            WebElement regexhelp = wait.until(ExpectedConditions.visibilityOfElementLocated(regexhelp_id));
            assertTrue("Failed, couldn't find Regex Help section", regexhelp_title.equals(regexhelp.getText()));
            Thread.sleep(3000);

            By troubleshootingtabula = By.linkText("Troubleshooting");
            WebElement troubleshooting_link = wait.until(ExpectedConditions.visibilityOfElementLocated(troubleshootingtabula));
            troubleshooting_link.click();
            String troubleshooting_title = "Having trouble with Tabula?";
            By troubleshooting_id = By.id("troubleshooting");
            WebElement troubleshooting = wait.until(ExpectedConditions.visibilityOfElementLocated(troubleshooting_id));
            assertTrue("Failed, couldn't find Troubleshooting section", troubleshooting_title.equals(troubleshooting.getText()));
            Thread.sleep(3000);

            //
            By libreoffice_text = By.linkText("LibreOffice Calc");
            WebElement libreoffice_link = wait.until(ExpectedConditions.elementToBeClickable(libreoffice_text));
            libreoffice_link.click();
            String libreoffice_url = "https://www.libreoffice.org/discover/calc/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find LibreOffice Calc page", driver.getCurrentUrl().equals(libreoffice_url));
            driver.navigate().back();

            By tutorialspoint_text = By.linkText("Tutorial's Point Regex Syntax");
            WebElement tutorialspoint_link = wait.until(ExpectedConditions.elementToBeClickable(tutorialspoint_text));
            tutorialspoint_link.click();
            String tutorialspoint_url = "https://www.tutorialspoint.com/java/java_regular_expressions.htm";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Tutorial's Point Regex Syntax page", driver.getCurrentUrl().equals(tutorialspoint_url));
            driver.navigate().back();

            By pdfsandwich_text = By.linkText("PDFSandwich");
            WebElement pdfsandwich_link = wait.until(ExpectedConditions.elementToBeClickable(pdfsandwich_text));
            pdfsandwich_link.click();
            String pdfsandwich_url = "http://www.tobias-elze.de/pdfsandwich/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find PDFSandwich page", driver.getCurrentUrl().equals(pdfsandwich_url));
            driver.navigate().back();

            By limeOCR_text = By.linkText("Lime OCR");
            WebElement limeOCR_link = wait.until(ExpectedConditions.elementToBeClickable(limeOCR_text));
            limeOCR_link.click();
            String limeOCR_url = "https://code.google.com/archive/p/lime-ocr/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find limeOCR page", driver.getCurrentUrl().equals(limeOCR_url));
            driver.navigate().back();

            By openrefine_text = By.linkText("OpenRefine");
            WebElement openrefine_link = wait.until(ExpectedConditions.elementToBeClickable(openrefine_text));
            openrefine_link.click();
            String openrefine_url = "http://openrefine.org/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find OpenRefine page", driver.getCurrentUrl().equals(openrefine_url));
            driver.navigate().back();

            By extractor_text = By.linkText("tabula-extractor");
            WebElement extractor_link = wait.until(ExpectedConditions.elementToBeClickable(extractor_text));
            extractor_link.click();
            String extractor_url = "https://github.com/tabulapdf/tabula-extractor";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find tabula-extractor page", driver.getCurrentUrl().equals(extractor_url));
            driver.navigate().back();

            By report_text = By.linkText("report it to us here");
            WebElement report_link = wait.until(ExpectedConditions.elementToBeClickable(report_text));
            report_link.click();
            String report_url = "https://github.com/tabulapdf/tabula/issues/new";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find GitHub's issue page", driver.getCurrentUrl().equals(report_url));
            driver.navigate().back();

            By about_text = By.linkText("one of the Tabula creators");
            WebElement about_icon = wait.until(ExpectedConditions.visibilityOfElementLocated(about_text));
            about_icon.click();
            String about_title = "About Tabula";
            By abouttabula_classname = By.className("abouttabula");
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            WebElement abouttabula = wait.until(ExpectedConditions.visibilityOfElementLocated(abouttabula_classname));
            assertTrue("Failed, couldn't find About page", about_title.equals(abouttabula.getText()));

        }catch(Exception e){
            System.out.print(e);

        }

    }
    //whether the test case passes or not, the instance of the browser will close
    @After
    public void TearDown(){
        driver.quit();
    }
}
