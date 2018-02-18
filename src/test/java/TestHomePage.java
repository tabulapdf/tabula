import org.junit.After;
import org.junit.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

import static junit.framework.TestCase.assertEquals;
import static junit.framework.TestCase.assertTrue;

// Test of Tabula's homepage, menu, media links at the bottom of the page, and button to click window explorer to upload files.
// Test will not test for uploading a file or clicking the extracting button to navigate to the extraction page
// Currently, this test case will not check for the Import button since the button is technically enabled but disabled to do anything
// @author SM modified: 2/16/18

public class TestHomePage {
        //Test of home page's menu tabs and making sure they are navigating to the corresponding paths
        WebDriver driver;
    @Test
    public void startWebDriver() throws InterruptedException{
        driver = new FirefoxDriver();
        driver.get("http://127.0.0.1:9292/");
        try{
            //navbar-brand and upload-nav when clicked just stay in the homepage
            driver.findElement(By.className("navbar-brand")).click();
            Thread.sleep(2000);
            driver.findElement(By.id("upload-nav")).click();
            Thread.sleep(2000);
            driver.findElement(By.id("templates-nav")).click();
            String text_template = "My Saved Templates";
            assertTrue("Failed, couldn't find My Templates page",text_template.equals(driver.findElement(By.className("my_saved_template_title")).getText()));
            driver.navigate().back();
            driver.findElement(By.id("about-nav")).click();
            assertTrue("Failed, About page", "About Tabula".equals(driver.findElement(By.className("abouttabula")).getText()));
            driver.navigate().back();
            driver.findElement(By.id("help-nav")).click();
            assertTrue("Failed, couldn't find Help page", "How to Use Tabula".equals(driver.findElement(By.name("howto")).getText()));
            driver.navigate().back();
            Thread.sleep(2000);
            driver.findElement(By.id("source-code")).click();
            assertEquals("Failed, couldn't find Tabula's GitHub page", driver.getCurrentUrl(), "https://github.com/tabulapdf/tabula");
            Thread.sleep(2000);
            driver.navigate().back();
            //Test of home page's media links located in the bottom of the page
            Thread.sleep(2000);
            driver.findElement(By.linkText("@TabulaPDF")).click();
            assertEquals("Failed, couldn't find Tabula's Twitter page", driver.getCurrentUrl(), "https://twitter.com/tabulapdf?lang=en");
            Thread.sleep(2000);
            driver.navigate().back();
            // https://tabula.technology's url is hard to check because of network issues causing it to not consistently load the page without a warning
            Thread.sleep(2000);
            driver.findElement(By.linkText("Tabulapdf")).click();
            assertEquals("Failed, couldn't find Tabula's Opencollective page", driver.getCurrentUrl(), "https://opencollective.com/tabulapdf");
            Thread.sleep(2000);
            driver.navigate().back();
            //Checking for smaller links located in How to use Tabula steps in the home page
            Thread.sleep(2000);
            driver.findElement(By.linkText("LibreOffice Calc")).click();
            assertEquals("Failed, couldn't find LibreOffice Calc page", driver.getCurrentUrl(), "https://www.libreoffice.org/discover/calc/");
            Thread.sleep(2000);
            driver.navigate().back();
            Thread.sleep(2000);
            driver.findElement(By.linkText("Help page")).click();
            assertTrue("Failed, couldn't find Help page from href link", "How to Use Tabula".equals(driver.findElement(By.name("howto")).getText()));
            driver.navigate().back();
            Thread.sleep(3000);
            driver.findElement(By.linkText("My Templates page")).click();
            assertTrue("Failed, couldn't find My Templates page","My Saved Templates".equals(driver.findElement(By.className("my_saved_template_title")).getText()));
            driver.navigate().back();
            Thread.sleep(2000);
            //Checking Browse button, which will open up File Explorer
            driver.findElement(By.className("input-group-btn")).click();
            Thread.sleep(2000);
            driver.quit();
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
