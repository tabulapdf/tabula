import org.junit.After;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.concurrent.TimeUnit;

import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertFalse;

//Test of Tabula's test page, which incorporates the hover menu per section and the links found on the page.
// All the links are tested except for LibreOffice Calc's link due to an existing exception thrown whenever clicked.
// The exception thrown is ElementClickInterceptedException where an element obscures the link from being clicked.
// LibreOffice Calc's link is tested however in TestHomePage test case, so this test case does not duplicate the same
// steps taken to test LibreOffice Calc. Additionally, the media menu is not tested for since it is already tested in
// TestHomePage.
//need to fix
// @author SM modified: 2/23/18

public class TestHelpPage {
    WebDriver driver;
    @Test
    public void startWebDriver(){
        System.setProperty("webdriver.chrome.driver","/usr/local/bin/chromedriver");
        ChromeOptions options = new ChromeOptions();
        //options.addArguments("headless");

        driver = new ChromeDriver(options);
        driver.get("http://127.0.0.1:9292/");
        driver.manage().window().maximize();
        WebDriverWait wait = new WebDriverWait(driver, 100);

        try{
            Thread.sleep(1000);
            //navigates to the help tab from the homepage
            By help_id = By.linkText("Help");
            WebElement help_icon = wait.until(ExpectedConditions.elementToBeClickable(help_id));
            help_icon.click();
            WebElement help_icon2 = wait.until(ExpectedConditions.elementToBeClickable(help_id));
            help_icon2.click();
            Thread.sleep(2000);
            String help_title = "How to Use Tabula";
            By tabulahelp_id = By.id("tabulahelp");
            WebElement helptabula = wait.until(ExpectedConditions.visibilityOfElementLocated(tabulahelp_id));
            assertTrue("Failed, couldn't find Help page", help_title.equals(helptabula.getText()));

            //the following will click to all of the links found in the help page except for LibreOffice Calc since it
            // has been tested before in the TestHomePage
            By tutorialspoint_text = By.className("tutorialspoint");
            WebElement tutorialspoint_link = wait.until(ExpectedConditions.elementToBeClickable(tutorialspoint_text));
            tutorialspoint_link.click();
            String tutorialspoint_url = "https://www.tutorialspoint.com/java/java_regular_expressions.htm";
            driver.manage().timeouts().pageLoadTimeout(150, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Tutorial's Point Regex Syntax page", driver.getCurrentUrl().equals(tutorialspoint_url));
            driver.navigate().back();

            By regex_text = By.linkText("here");
            WebElement regex_link = wait.until(ExpectedConditions.elementToBeClickable(regex_text));
            regex_link.click();
            String regex_url = "https://regexr.com/";
            driver.manage().timeouts().pageLoadTimeout(60, TimeUnit.SECONDS);
            assertTrue("Failed, couldn't find Tutorial's Point Regex Syntax page", driver.getCurrentUrl().equals(regex_url));
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
            assertFalse("Failed, couldn't find GitHub's sign-in page to view the issues page", driver.getCurrentUrl().equals(report_url));
            driver.navigate().back();

            By about_text = By.linkText("one of the Tabula creators.");
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
